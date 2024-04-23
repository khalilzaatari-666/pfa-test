import React, { useState, useEffect, useRef } from "react";
import { classNames } from "primereact/utils";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Toast } from "primereact/toast";
import { Button } from "primereact/button";
import { FileUpload } from "primereact/fileupload";
import { Toolbar } from "primereact/toolbar";
import { Dialog } from "primereact/dialog";
import { InputText } from "primereact/inputtext";
import "./MLModelList.css";
import { ModelService } from "./ModelService";
import "primereact/resources/themes/lara-light-indigo/theme.css";
import "primereact/resources/primereact.min.css";
import "primeicons/primeicons.css";

const MLModelList = () => {
  let emptyModel = {
    _id: null,
    name: "",
    type: "",
  };

  const [models, setModels] = useState(null);
  const [modelDialog, setModelDialog] = useState(false);
  const [deleteModelDialog, setDeleteModelDialog] = useState(false);
  const [deleteModelsDialog, setDeleteModelsDialog] = useState(false);
  const [model, setModel] = useState(emptyModel);
  const [selectedModels, setSelectedModels] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [globalFilter, setGlobalFilter] = useState(null);
  const toast = useRef(null);
  const dt = useRef(null);
  const modelService = new ModelService();

  useEffect(() => {
    modelService.getModels().then((data) => {
      console.log(data);
      setModels(data);
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const openNew = () => {
    setModel(emptyModel);
    setSubmitted(false);
    setModelDialog(true);
  };

  const hideDialog = () => {
    setSubmitted(false);
    setModelDialog(false);
  };

  const hideDeleteModelDialog = () => {
    setDeleteModelDialog(false);
  };

  const hideDeleteModelsDialog = () => {
    setDeleteModelsDialog(false);
  };

  const saveModel = async () => {
    setSubmitted(true);
  
    if (model.name.trim()) {
      try {
        let formData = new FormData();
        formData.append("name", model.name);
        formData.append("type", model.type);
        formData.append("file", model.file); // Assuming model.file contains the uploaded file
  
        let response;
        if (model._id) {
          // Update existing model
          formData.append("_id", model._id); // Include _id if updating
          response = await fetch(`http://127.0.0.1:5000/models/${model._id}`, {
            method: "PUT",
            body: JSON.stringify(Object.fromEntries(formData.entries())), // Convert FormData to JSON
            headers: {
              "Content-Type": "application/json",
            },
          });
        } else {
          // Create new model
          response = await fetch("http://127.0.0.1:5000/models", {
            method: "POST",
            body: JSON.stringify(Object.fromEntries(formData.entries())), // Convert FormData to JSON
            headers: {
              "Content-Type": "application/json",
            },
          });
        }
  
        if (response.ok) {
          const data = await response.json();
          const message = model._id ? "Model Updated" : "Model Created";
          toast.current.show({
            severity: "success",
            summary: "Successful",
            detail: message,
            life: 3000,
          });
          // Update or refresh your models list as needed
          setModelDialog(false);
          setModel(emptyModel);
        } else {
          throw new Error("Failed to save model.");
        }
      } catch (error) {
        console.error("Error saving model:", error);
      }
    }
  };
  
  

  const editModel = (model) => {
    setModel({ ...model });
    setModelDialog(true);
  };

  const confirmDeleteModel = (model) => {
    setModel(model);
    setDeleteModelDialog(true);
  };

  const deleteModel = async () => {
    try {
      const response = await fetch(
        `http://127.0.0.1:5000/models/${model._id}`,
        {
          method: "DELETE",
        }
      );

      if (response.ok) {
        const _models = models.filter((val) => val._id !== model._id);
        setModels(_models);
        setDeleteModelDialog(false);
        setModel(emptyModel);
        toast.current.show({
          severity: "success",
          summary: "Successful",
          detail: "Model Deleted",
          life: 3000,
        });
      } else {
        throw new Error("Failed to delete model.");
      }
    } catch (error) {
      console.error("Error deleting model:", error);
    }
  };

  const confirmDeleteSelected = () => {
    setDeleteModelsDialog(true);
  };

  const deleteSelectedModels = async () => {
    if (!selectedModels || selectedModels.length === 0) {
      return;
    }

    try {
      const deletePromises = selectedModels.map((model) => {
        return fetch(`http://127.0.0.1:5000/models/${model._id}`, {
          method: "DELETE",
        });
      });

      const responses = await Promise.all(deletePromises);
      const deletedIds = responses.reduce((acc, response, index) => {
        if (response.ok) {
          acc.push(selectedModels[index]._id);
        }
        return acc;
      }, []);

      if (deletedIds.length > 0) {
        const remainingModels = models.filter(
          (model) => !deletedIds.includes(model._id)
        );
        setModels(remainingModels);
        setDeleteModelsDialog(false);
        setSelectedModels(null);
        toast.current.show({
          severity: "success",
          summary: "Successful",
          detail: "Models Deleted",
          life: 3000,
        });
      } else {
        throw new Error("Failed to delete models.");
      }
    } catch (error) {
      console.error("Error deleting models:", error);
    }
  };

  const onInputChange = (e, name) => {
    const val = (e.target && e.target.value) || "";
    let _model = { ...model };
    _model[`${name}`] = val;

    setModel(_model);
  };

  const onFileChange = (e) => {
    const file = e.files && e.files[0];
    setModel((prevState) => ({ ...prevState, file: file }));
  };

  const actionBodyTemplate = (rowData) => {
    return (
      <React.Fragment>
        <Button
          icon="pi pi-pencil"
          className="p-button-rounded p-button-success mr-2"
          onClick={() => editModel(rowData)}
        />
        <Button
          icon="pi pi-trash"
          className="p-button-rounded p-button-warning"
          onClick={() => confirmDeleteModel(rowData)}
        />
      </React.Fragment>
    );
  };

  const header = (
    <div className="table-header">
      <h5 className="mx-0 my-1">Manage Models</h5>
      <span className="p-input-icon-left">
        <i className="pi pi-search" />
        <InputText
          type="search"
          onInput={(e) => setGlobalFilter(e.target.value)}
          placeholder="Search..."
        />
      </span>
    </div>
  );
  const modelDialogFooter = (
    <React.Fragment>
      <Button
        label="Cancel"
        icon="pi pi-times"
        className="p-button-text"
        onClick={hideDialog}
      />
      <Button
        label="Save"
        icon="pi pi-check"
        className="p-button-text"
        onClick={saveModel}
      />
    </React.Fragment>
  );
  const deleteModelDialogFooter = (
    <React.Fragment>
      <Button
        label="No"
        icon="pi pi-times"
        className="p-button-text"
        onClick={hideDeleteModelDialog}
      />
      <Button
        label="Yes"
        icon="pi pi-check"
        className="p-button-text"
        onClick={deleteModel}
      />
    </React.Fragment>
  );
  const deleteModelsDialogFooter = (
    <React.Fragment>
      <Button
        label="No"
        icon="pi pi-times"
        className="p-button-text"
        onClick={hideDeleteModelsDialog}
      />
      <Button
        label="Yes"
        icon="pi pi-check"
        className="p-button-text"
        onClick={deleteSelectedModels}
      />
    </React.Fragment>
  );

  const leftToolbarTemplate = () => {
    return (
      <React.Fragment>
        <Button
          label="New"
          icon="pi pi-plus"
          className="p-button-success mr-2"
          onClick={openNew}
        />
        <Button
          label="Delete"
          icon="pi pi-trash"
          className="p-button-danger"
          onClick={confirmDeleteSelected}
          disabled={!selectedModels || !selectedModels.length}
        />
      </React.Fragment>
    );
  };

  return (
    <div className="datatable-crud-demo">
      <Toast ref={toast} />

      <div className="card">
        <Toolbar className="mb-4" left={leftToolbarTemplate}></Toolbar>

        <DataTable
          ref={dt}
          value={models}
          selection={selectedModels}
          onSelectionChange={(e) => setSelectedModels(e.value)}
          dataKey="id"
          paginator
          rows={10}
          rowsPerPageOptions={[5, 10, 25]}
          paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
          globalFilter={globalFilter}
          header={header}
          responsiveLayout="scroll"
        >
          <Column
            key="selection"
            selectionMode="multiple"
            headerStyle={{ width: "3rem" }}
            exportable={false}
          ></Column>
          <Column
            key="name"
            field="name"
            header="Name"
            sortable
            style={{ minWidth: "16rem" }}
          ></Column>
          <Column
            key="type"
            field="type"
            header="Type"
            sortable
            style={{ minWidth: "12rem" }}
          ></Column>
          <Column
            key="actions"
            body={actionBodyTemplate}
            exportable={false}
            style={{ minWidth: "8rem" }}
          ></Column>
        </DataTable>
      </div>

      <Dialog
        visible={modelDialog}
        style={{ width: "450px" }}
        header="Model Details"
        modal
        className="p-fluid"
        footer={modelDialogFooter}
        onHide={hideDialog}
      >
        <div className="field">
          <label htmlFor="name">Name</label>
          <InputText
            id="name"
            value={model.name}
            onChange={(e) => onInputChange(e, "name")}
            required
            autoFocus
            className={classNames({ "p-invalid": submitted && !model.name })}
          />
          {submitted && !model.name && (
            <small className="p-error">Name is required.</small>
          )}
        </div>
        <div className="field">
          <label htmlFor="type">Type</label>
          <InputText
            id="type"
            value={model.type}
            onChange={(e) => onInputChange(e, "type")}
            required
            autoFocus
            className={classNames({ "p-invalid": submitted && !model.type })}
          />
          {submitted && !model.type && (
            <small className="p-error">Type is required.</small>
          )}
        </div>
        <div className="field">
          <label htmlFor="file">Upload File</label>
          <FileUpload
            mode="basic"
            name="upload"
            url="http://127.0.0.1:5000/models"
            accept=".py"
            maxFileSize={1000000}
            onUpload={onFileChange}
            chooseLabel="Select File"
            uploadLabel="Upload"
            cancelLabel="Cancel"
          />
        </div>
      </Dialog>

      <Dialog
        visible={deleteModelDialog}
        style={{ width: "450px" }}
        header="Confirm"
        modal
        footer={deleteModelDialogFooter}
        onHide={hideDeleteModelDialog}
      >
        <div className="confirmation-content">
          <i
            className="pi pi-exclamation-triangle mr-3"
            style={{ fontSize: "2rem" }}
          />
          {model && (
            <span>
              Are you sure you want to delete <b>{model.name}</b>?
            </span>
          )}
        </div>
      </Dialog>

      <Dialog
        visible={deleteModelsDialog}
        style={{ width: "450px" }}
        header="Confirm"
        modal
        footer={deleteModelsDialogFooter}
        onHide={hideDeleteModelsDialog}
      >
        <div className="confirmation-content">
          <i
            className="pi pi-exclamation-triangle mr-3"
            style={{ fontSize: "2rem" }}
          />
          {model && (
            <span>Are you sure you want to delete the selected models?</span>
          )}
        </div>
      </Dialog>
    </div>
  );
};

export default MLModelList;
