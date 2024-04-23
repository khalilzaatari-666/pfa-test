from datetime import datetime
from bson import ObjectId
from flask import Flask, request, jsonify
from pymongo import MongoClient
import os

app = Flask(__name__)
client = MongoClient('mongodb://localhost:27017/')
db = client['pfa']
models_collection = db['models']

UPLOAD_DIRECTORY = os.path.join(os.getcwd(), 'uploads')
if not os.path.exists(UPLOAD_DIRECTORY):
    os.makedirs(UPLOAD_DIRECTORY)

class Model:
    def __init__(self, name, type, file_path):
        self.name = name
        self.type = type
        self.date_added = datetime.now()
        self.file_path = file_path

    def save_to_db(self):
        models_collection.insert_one({
            'name': self.name,
            'type': self.type,
            'date_added': self.date_added,
            'file_path': self.file_path
        })

    def delete_from_db(self):
        models_collection.delete_one({'name': self.name})

    def update_in_db(self, updates):
        models_collection.update_one({'name': self.name}, {'$set': updates})

    def get_from_db(self):
        model = models_collection.find_one({'name': self.name})
        if model:
            model['_id'] = str(model['_id'])
            return model
        else:
            return None

    def to_dict(self):
        return {
            'name': self.name,
            'type': self.type,
            'date_added': self.date_added.strftime('%Y-%m-%d %H:%M:%S'),
            'file_path': self.file_path
        }

    @classmethod
    def from_dict(cls, data):
        return cls(
            name=data['name'],
            type=data['type'],
            file_path=data['file_path']
        )


if __name__ == '__main__':
    app.run(debug=True)
