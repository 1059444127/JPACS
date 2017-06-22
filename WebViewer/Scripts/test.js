
require.config({
    baseUrl: "./Scripts",
    paths: {
        "jquery": "lib/jquery",
        "jCanvaScript": "lib/jCanvaScript",
        "dicomViewer": "dicom/dicomViewer",
        "dicomUtil": "dicom/dicomUtil"
    },
    config:{
    	'dicomViewer':{
    		annPath: 'dicom' //the file path dicomViewer will search for annObjects.(deserialize)
    	}
    }
});

require(['lib/domReady!'], function(){
require(['jquery', 'spec/dicomViewerSpec', 'spec/annLineSpec'], function($){
	
	if(window.loadTests){
		window.loadTests();
	}
});
});
    