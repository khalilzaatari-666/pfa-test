import ast
from datetime import datetime
import os
import subprocess
from bson import ObjectId # type: ignore
from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
from pymongo import MongoClient
import nbformat

app = Flask(__name__)
CORS(app)
client = MongoClient('mongodb://localhost:27017/')
db = client['pfa']
models_collection = db['models']

UPLOAD_DIRECTORY = os.path.join(os.getcwd(), 'uploads')
if not os.path.exists(UPLOAD_DIRECTORY):
    os.makedirs(UPLOAD_DIRECTORY)

@app.route('/models', methods=['GET'])
def get_models():
    cursor = models_collection.find({}, {'_id':0})
    models = list(cursor)
    return jsonify(models)

@app.route('/models', methods=['POST'])
def create_model():
    model_name = request.form.get('name')
    model_type = request.form.get('type')
    script_file = request.files.get('file')

    if not script_file:
        return jsonify({'error': 'No file uploaded.'}), 400

    # Save the uploaded file to the backend directory
    file_path = os.path.join(UPLOAD_DIRECTORY, script_file.filename)
    script_file.save(file_path)

    # Create the model object with the file path
    date_added = datetime.now()
    model_data = {
        'name': model_name,
        'type': model_type,
        'date_added': date_added,
        'file_path': file_path  # Store the file path in the MongoDB document
    }
    models_collection.insert_one(model_data)

    return jsonify({'message': 'Model created successfully.'}), 201

@app.route('/models/<id>', methods=['DELETE'])
def delete_model(id):
    result = models_collection.delete_one({'_id': ObjectId(id)})
    if result.deleted_count > 0:
        return jsonify({'message': 'Model deleted'}), 200
    else:
        return jsonify({'error': 'Model not found'}), 404

@app.route('/models/<id>', methods=['PUT'])
def update_model(id):
    data = request.get_json()
    updates = {'$set': data}
    result = models_collection.update_one({'_id': ObjectId(id)}, updates)
    if result.modified_count > 0:
        return jsonify({'message': 'Model updated'}), 200
    else:
        return jsonify({'error': 'Model not found'}), 404
    

@app.route('/models/<id>/file', methods=['GET'])
def get_model_file(id):
    model = models_collection.find_one({'_id': ObjectId(id)})
    if model:
        file_path = model.get('file_path')
        if file_path:
            return send_file(file_path, as_attachment=True)
        else:
            return jsonify({'error': 'File path not found for the model'}), 404
    else:
        return jsonify({'error': 'Model not found'}), 404


if __name__ == '__main__':
    app.run(debug=True)