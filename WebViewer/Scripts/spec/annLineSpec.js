
define(["dicom/annLine", "dicom/dicomViewer"], function (annLine, dicomViewer) {
    describe("annLine", function () {
    	var dv;
    	
		beforeAll(function(){
			dv = new dicomViewer('testCanvas');
		});
		
        it("new annLine", function() {
			var aLine = new annLine();
            expect(aLine.type).toEqual(2);
        });

    });
});