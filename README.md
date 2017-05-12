# JPACS

## Road map

### Phase 1: prototype and research

	1. Use canvas to show/rotate/pan DICOM image.
	2. Use canvas and JS to draw annotation.
	3. Use fo-dicom + ASP.NET MVC to build a sample SSCP, and a sample Web Viewer.


### Phase 2:

	1. Annotation object model at JS side.
		1. Edit model (pan, new annotation, edit annotation)
		2. Annotation model (text, line, rectangle, etc)

	2. Annotation and transform information into DCM file. (DCM tag support)
	3. Save and load annotation/transform.


### Phase 3:

	1. Server side combine annotation (use fo-dicom).
		1. save to image and check.

	2. PSSI tree in Web Viewer.
	3. Server side DICOM print.
	4. Transfer/Export.
	5. Eclipse.
	6. Window Width/Window Height adjust support.(use web socket?)

