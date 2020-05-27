let plot, vf, xInput, yInput, submitBtn, themeBtn, xLabel, yLabel;
let vecScaleSlider, vecDensSlider, constSlider, needsUpdate, mousePos;
let vfIntermediateSurf;
let canvas;

class VectorField {
  
  constructor(plot, xfunc, yfunc, vecsPerUnit, theme="blue") {
    this.plot = plot;
    this.xfunc = xfunc;
    this.yfunc = yfunc;
    this.vecsPerUnit = vecsPerUnit;
    this.step = 1 / vecsPerUnit;
    this.vectorScale = 8;
	this.colorScale = 255 / PI;
    this.parser = math.parser();
    this.theme = theme;
    this.setA(0);
  }
  
  setA(a) {
    this.a = a;
    this.parser.set("a", a);
    this.generateVectors(vfIntermediateSurf);
    needsUpdate = true;
  }
  
  evaluate(x, y) {
    this.parser.set("x", x);
    this.parser.set("y", y);
    return {dx: this.parser.evaluate(this.xfunc), dy: this.parser.evaluate(this.yfunc),};
  }
  
  drawArrow(A, B, canv) {
    let dx, dy, angle, mang, dist, x1, x2, y1, y2;
    
    dx = A.x - B.x;
    dy = A.y - B.y;
    angle = atan2(dy, dx);
    dist = sqrt(dx*dx+dy*dy) / 5;
	mang = this.colorScale * abs(angle);
    
    x1 = dist * cos(angle + QUARTER_PI);
    y1 = dist * sin(angle + QUARTER_PI);
    x2 = dist * cos(angle - QUARTER_PI);
    y2 = dist * sin(angle - QUARTER_PI);
    
    if (this.theme === "red") {
      canv.stroke(mang, 255-mang, 0);
    } else {
      canv.stroke(255-mang, mang, mang);
    }
    
    canv.strokeWeight(2);
    canv.line(A.x, A.y, B.x, B.y);
    canv.line(B.x, B.y, B.x + x1, B.y + y1);
    canv.line(B.x, B.y, B.x + x2, B.y + y2);
  }
  
  generateVectors(canv) {
    this.vectors = [];
    let x, y, res;
    try {
      for (x=this.plot.xStart; x<=this.plot.xStop; x+=this.step) {
        for (y=this.plot.yStart; y<=this.plot.yStop; y+=this.step) {
          res = this.evaluate(x, y);
          this.vectors.push({x: x, y: y, tx: x + res.dx / this.vectorScale, ty: y + res.dy / this.vectorScale,});
        }
      }
    } catch (error) {
      alert(error);
    }
    canv.background(255);
    this.drawVectors(canv);
  }
  
  drawVectors(canv) {
    let vec;
    for (let i=0; i<this.vectors.length; i++) {
      vec = this.vectors[i];
      this.drawArrow(this.plot.translateAndScale(vec.x, vec.y), this.plot.translateAndScale(vec.tx, vec.ty), canv);
    }
  }
  
  drawFlowline(pos, step=0.2, steps=50) {
    let t, value, A, B, angle, mang;
    strokeWeight(2);
	
    for (t=0; t<steps; t++) {
      value = this.evaluate(pos.x, pos.y);
      angle = atan2(value.dy, value.dx);
      value.dx = step * cos(angle);
      value.dy = step * sin(angle);
	  mang = this.colorScale * abs(angle);
	  stroke(255-mang, mang, mang);
          
      A = this.plot.translateAndScale(pos.x, pos.y);
      B = this.plot.translateAndScale(pos.x + value.dx, pos.y + value.dy);
      line(A.x, A.y, B.x, B.y);
      pos = {x: value.dx + pos.x, y: value.dy + pos.y,};
    }
  }
  
  surroundingFlowlines(pos, dist, nlines, step) {
    let theta, v;
    for (theta=0; theta<TWO_PI; theta+=TWO_PI/nlines) {
      v = 128 * theta / TWO_PI
      this.drawFlowline({x: pos.x + dist * cos(theta), y: pos.y + dist * sin(theta),}, 255, v, v, step, 50);
    }
  }
  
  flowlineGrid(step=1) {
    let x, y;
    for (x=this.plot.xStart; x<this.plot.xStop; x+=step) {
      for (y=this.plot.yStart; y<this.plot.yStop; y+=step) {
        this.drawFlowline({x: x, y: y,}, 0.2, 50);
      }
    }
  }
  
}

class Plot {
  
  constructor(xStart, xStop, yStart, yStop) {
    this.xStart = xStart;
    this.yStart = yStart;
    this.xStop = xStop;
    this.yStop = yStop;
    
    this.xUnits = xStop - xStart;
    this.yUnits = yStop - yStart;
    this.xScale = width / this.xUnits;
    this.yScale = height / this.yUnits;
  }
  
  translateAndScale(x, y) {
    return {x: x * this.xScale + width / 2, y: height / 2 - y * this.yScale,};
  }
  
  reverseTranslate(x, y) {
    return {x: (x - width / 2) / this.xScale, y: (height / 2 - y) / this.yScale,};
  }
  
  drawAxes(canv){
    let A, B;
    canv.stroke(0);
    canv.strokeWeight(3);
    A = this.translateAndScale(0, this.yStart);
    B = this.translateAndScale(0, this.yStop);
    canv.line(A.x, A.y - 1, B.x, B.y - 1);
    A = this.translateAndScale(this.xStart, 0);
    B = this.translateAndScale(this.xStop, 0);
    canv.line(A.x - 1, A.y, B.x - 1, B.y);
  }
  
}

function handleSetVF() {	
  const xFunc = document.getElementById("function1").value;
  const yFunc = document.getElementById("function2").value;
  
  vf.xfunc = xFunc.toLowerCase();
  vf.yfunc= yFunc.toLowerCase();
  vf.generateVectors(vfIntermediateSurf);
  needsUpdate = true;
}

function handleThemeSwitch() {
  if (vf.theme === "red") {
    vf.theme = "blue";
  } else {
    vf.theme = "red";
  }
  vf.generateVectors(vfIntermediateSurf);
  needsUpdate = true;
}

function handleScaleSlider() {
  vecScaleSlider = document.getElementById("vector-scale");
  if (vf.vectorScale !== vecScaleSlider.value) {
    vf.vectorScale = vecScaleSlider.value;
    vf.generateVectors(vfIntermediateSurf);
    needsUpdate = true;
  }
}

function handleDensSlider() {
  vecDensSlider = document.getElementById("vector-density");
  if (vf.vecsPerUnit !== vecDensSlider.value) {
    vf.vecsPerUnit = vecDensSlider.value;
    vf.step = 1 / vf.vecsPerUnit;
    vf.generateVectors(vfIntermediateSurf);
    needsUpdate = true;
  }
}

function handleConstSlider() {
  constSlider = document.getElementById("constant");
  if (constSlider.value !== vf.a) {
    vf.setA(constSlider.value);
  }
}

function toggleInstructions() {
  let d = document.getElementById("instructions-div");
  if (d.style.display === "none") {
    d.style.display = "block";
  } else {
    d.style.display = "none";
  }
}

function setup() {
  canvas = createCanvas(windowHeight, windowHeight);
  vfIntermediateSurf = createGraphics(windowHeight, windowHeight);
  canvas.parent("canvas-div");
  plot = new Plot(-5, 5, -5, 5);
  vf = new VectorField(plot, "y", "a-x", 1.5);
  vf.drawVectors(vfIntermediateSurf);
  needsUpdate = true;
}

function draw() {
  handleScaleSlider();
  handleDensSlider();
  handleConstSlider();
  if (needsUpdate) {
    background(255);
    if (document.getElementById("vector-checkbox").checked) {
      plot.drawAxes(vfIntermediateSurf);
      image(vfIntermediateSurf, 0, 0);
    }
    
    if (document.getElementById("flowline-checkbox").checked) {
      plot.drawAxes(canvas);
      vf.flowlineGrid(2);
    }
    //mousePos = plot.reverseTranslate(mouseX, mouseY);
    //vf.surroundingFlowlines({x: mousePos.x, y: mousePos.y,}, 0.2, 5, 0.3);
    needsUpdate = false;
  }
}