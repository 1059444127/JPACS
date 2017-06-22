
define(["dicom/dicomViewer"], function (dicomViewer) {
    describe("dicomViewer", function () {
		
        it("new viewer", function() {
			var viewer = new dicomViewer('testCanvas');
            expect(viewer.canvasId).toEqual("testCanvas");
        });

    });
});