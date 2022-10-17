import './App.css';
import { IfcViewerAPI } from 'web-ifc-viewer';
import { Backdrop, CircularProgress, IconButton } from '@material-ui/core';
import { Raycaster, Vector2 } from "three";

import React from 'react';
import Dropzone from 'react-dropzone';
import BcfDialog from './components/BcfDialog';

//Icons
import FolderOpenOutlinedIcon from '@material-ui/icons/FolderOpenOutlined';
import CropIcon from '@material-ui/icons/Crop';
import FeedbackOutlinedIcon from '@material-ui/icons/FeedbackOutlined';
import { acceleratedRaycast, computeBoundsTree, disposeBoundsTree } from "three-mesh-bvh";
import { MeshLambertMaterial } from "three";


const ifcModels = [];
const raycaster = new Raycaster();
const mouse = new Vector2();
const preselectMat = new MeshLambertMaterial({
    transparent: true,
    opacity: 0.6,
    color: 0xff88ff,
    depthTest: false,
  });
//const viewer = null;
class App extends React.Component {

   
    state = {
        bcfDialogOpen: false,
        loaded: false,
        loading_ifc: false
    };

    constructor(props) {
        super(props);
        this.dropzoneRef = React.createRef();
       // this.viewer = [];
    }

    

    componentDidMount() {
        const container = document.getElementById('viewer-container');
        raycaster.firstHitOnly = true;
        
        
        this.viewer = new IfcViewerAPI({container});
        container.ondblclick = this.pick;
        this.viewer .addAxes();
        this.viewer .addGrid();
        this.viewer .IFC.setWasmPath('../../');
       // this.loadIFC(ifcLoader , ifcModels , viewer.context.getScene)
       // this.viewer = viewer;
       this.viewer .IFC.setupThreeMeshBVH(computeBoundsTree, disposeBoundsTree, acceleratedRaycast)
        window.onmousemove = this.viewer.prepickIfcItem;
        window.ondblclick = this.viewer.addClippingPlane
        
    }


      loadIFC = async (ifcLoader , ifcModels , scene) => {
        ifcLoader.load("C:\\Users\\А д м и н\\Documents\\AV-151221-KM.ifc", (ifcModel) => {
            ifcModels.push(ifcModel);
            scene.add(ifcModel);
            console.log(ifcModels.length);
          });
          
       };

     

       pick = async (event) => {
        //console.log(this.viewer);
        const found = await this.cast(event);
        console.log("Found pick element");
        if (found.length > 0){
           // console.log(found)
            
            
            const found_simple = found[0];
            const modelID = found_simple.object.modelID;
            const index = found_simple.faceIndex;
            const geometry = found_simple.object.geometry;
            const ifc = this.viewer.IFC.loader.ifcManager;
            //console.log(ifc);
                //ifcLoader.ifcManager;
            const id = ifc.getExpressId(geometry, index);
            console.log(id);
            const props = await ifc.getItemProperties(modelID, id);
            const props1 = await ifc.getMaterialsProperties(modelID, id);
            console.log(props);
            console.log(props1);
               // Creates subset
          this.viewer.IFC.loader.ifcManager.createSubset({
          modelID: modelID,
          ids: [id],
          material: preselectMat,
          scene: this.viewer.context.getScene(),
          removePrevious: true,
        });
     }
    };


    highlight  = async (model) => {
    
    };
      
      cast = async (event) => {
        const threeCanvas = document.getElementById('viewer-container');
        // Computes the position of the mouse on the screen
        const bounds = threeCanvas.getBoundingClientRect();
      
        const x1 = event.clientX - bounds.left;
        const x2 = bounds.right - bounds.left;
        mouse.x = (x1 / x2) * 2 - 1;
      
        const y1 = event.clientY - bounds.top;
        const y2 = bounds.bottom - bounds.top;
        mouse.y = -(y1 / y2) * 2 + 1;
        // Places it on the camera pointing to the mouse
        raycaster.setFromCamera(mouse, this.viewer.context.getCamera());


        // Casts a ray
        return raycaster.intersectObjects(ifcModels);
    };


    onDrop = async (files) => {
        this.setState({ loading_ifc: true })
        var model = await this.viewer.IFC.loadIfc(files[0], true);
        ifcModels.push(model)
        console.log(ifcModels);
        this.setState({ loaded: true, loading_ifc: false })
    };

    handleToggleClipping = () => {
        this.viewer.clipper.active = !this.viewer.clipper.active;
    };

    handleClickOpen = () => {
        this.dropzoneRef.current.open();
    };

    handleOpenBcfDialog = () => {
        this.setState({
            ...this.state,
            bcfDialogOpen: true
        });
    };

    handleCloseBcfDialog = () => {
        this.setState({
            ...this.state,
            bcfDialogOpen: false
        });
    };

    handleOpenViewpoint = (viewpoint) => {
        this.viewer.currentViewpoint = viewpoint;
    };

 

    render() {
        return (
          <>
              <BcfDialog
                open={this.state.bcfDialogOpen}
                onClose={this.handleCloseBcfDialog}
                onOpenViewpoint={this.handleOpenViewpoint}
              />
              <div style={{ display: 'flex', flexDirection: 'row', height: '100vh' }}>
                  <aside style={{ width: 50 }}>
                      <IconButton onClick={this.handleClickOpen}>
                          <FolderOpenOutlinedIcon />
                      </IconButton>
                      <IconButton onClick={this.handleToggleClipping}>
                          <CropIcon />
                      </IconButton>
                    {/*  <IconButton onClick={this.handleOpenBcfDialog}>
                          <FeedbackOutlinedIcon />
                      </IconButton>*/}
                  </aside>
                  <Dropzone ref={this.dropzoneRef} onDrop={this.onDrop}>
                      {({ getRootProps, getInputProps }) => (
                        <div {...getRootProps({ className: 'dropzone' })}>
                            <input {...getInputProps()} />
                        </div>
                      )}
                  </Dropzone>
                  <div style={{ flex: '1 1 auto', minWidth: 0 }}>
                      <div id='viewer-container' style={{ position: 'relative', height: '100%', width: '100%' }} />
                  </div>
              </div>
              <Backdrop
                style={{
                    zIndex: 100,
                    display: "flex",
                    alignItems: "center",
                    alignContent: "center"
                }}
                open={this.state.loading_ifc}
              >
                  <CircularProgress/>
              </Backdrop>
          </>
        );
    }

    
}

export default App;
