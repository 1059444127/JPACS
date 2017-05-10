
(function (){
	
	//the base class
	
	function annObject(){
		
	}
	
	
	//the annRect class
	function annRect(x, y, rect, width){
		annObject.call(this);
		
	}
	
	annRect.prototype = new annObject();
	
	//the annLine class
	function annLine(startX, startY, endX, endY){
		annObject.call(this);
	}
	
	annLine.prototype = new annObject();
	
})();
