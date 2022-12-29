// Define vector object and methods
//
//
  var Vector2D = function Vector2D(x, y) {
    this.set(x, y);
  }, v2dp = Vector2D.prototype;

  v2dp.dot2d = function(x, y) {
    return ((this.x * x) + (this.y * y));
  };


  v2dp.set = function(x, y) {
    this.x = x;
    this.y = y;

    return this;
  };

  v2dp.add = function(other) {
    if(typeof other === "number") {
      this.x += other, this.y += other;
      return this;
    }
    this.x += other.x, this.y += other.y;
    return this;
  };

  v2dp.sub = function(other) {
    if(typeof other === "number") {
      this.x -= other, this.y -= other;
      return this;
    }
    this.x -= other.x, this.y -= other.y;
    return this;
  };

  v2dp.mul = function(other) {
    if(typeof other === "number") {
      this.x *= other, this.y *= other;
      return this;
    }
    this.x *= other.x, this.y *= other.y;
    return this;
  };

  v2dp.div = function(other) {
    if(typeof other === "number") {
      this.x /= other, this.y /= other;
      return this;
    }
    this.x /= other.x, this.y /= other.y;
    return this;
  };

  v2dp.move = function(dest) {
    if(dest instanceof Vector2D) {
      dest.x = this.x, dest.y = this.y;
    }
    return this;
  };

  v2dp.within2d = function(bounds) {
    return (this.x >= 0 && this.x < bounds.x && this.y >= 0 && this.y < bounds.y);
  };

  v2dp.wrap2d = function(bounds) {
    if(this.x > bounds.x) {
      this.x = 0;
      return true;
    }

    if(this.x < 0) {
      this.x = bounds.x;
      return true;
    }

    if(this.y > bounds.y) {
      this.y = 0;
      return true;
    }

    if(this.y < 0) {
      this.y = bounds.y;
      return true;
    }
  };

  v2dp.eq = function(other) {
    return (other instanceof Vector2D) && this.x === other.x && this.y === other.y;
  };

  v2dp.distance = function(other) {
    var dx = (this.x - other.x),
        dy = (this.y - other.y);

    return Math.sqrt(dx * dx + dy * dy);
  };

  v2dp.clone = function() {
    return new Vector2D(this.x, this.y);
  };


// Define particle object and methods
//
//
  var Particle = function Particle(x, y, bounds, particleTrailWidth, strokeColor, rotateSpeed) {
    this.p = new Vector2D(x,y); // position
    context.arc(500, 500, 20, 0, Math.PI * 2, true); // circle
    this.t = new Vector2D(x,y); // trail to
    this.v = new Vector2D(1,1); // velocity
    this.theta = 0; // angle of velocity vector
    this.color = strokeColor;
    this.particleTrailWidth = particleTrailWidth;
    this.rotateSpeed = rotateSpeed;
    this.b = bounds;    // window bounds for wrapping
    this.m = new MouseMonitor(canvas);       // mouse position monitor
    this.r = function getRandom(min,max) {
        return Math.random() * (max - min) + min;
    }
  }, pp = Particle.prototype;

  pp.reset = function() {
    // new random position
    this.p.x = this.t.x = 0; //Math.floor(this.r(0, this.b.x));
    this.p.y = this.t.y = 0; //Math.floor(this.r(0, this.b.y));

    // reset velocity
    this.v.set(1, 1);
    // set theta
    this.theta = Math.PI / 4;

    // iteration and life
    this.i = 0;
    this.l = this.r(1000, 10000); // life time before particle respawns

  };

  pp.step = function() {
    if(this.i++ > this.l) {
      this.reset();
    }

    var xx = (this.p.x / 200),
        yy = (this.p.y / 200),
        zz = (Date.now() / 5000),
        a  = this.r(0, Math.Tau),
        rnd= (this.r(0,1)  / 4);
    // calculate the new velocity based on the noise
    // random velocity in a random direction
    this.v.x += this.r(-0.1,0.1);//(rnd * Math.sin(a)); // sin or cos, no matter
    this.v.y += this.r(0.01,0.5);//(rnd * Math.cos(a));  // opposite zz's matters

    if(this.m.state.left) {
      // add a difference between mouse pos and particle pos (a fraction of it) to the velocity.
      this.v.add(this.m.position.clone().sub(this.p).mul(.00085));
    }

    // repulse the particles if the right mouse button is down and the distance between
    // the mouse and particle is below an arbitrary value between 200 and 250.
    if(this.m.state.right && this.p.distance(this.m.position) < this.r(200, 250)) {
      this.v.add(this.p.clone().sub(this.m.position).mul(.02));
    }

    // time dilation field, stuff moves at 10% here, depending on distance
    if(this.m.state.middle) {
      var d = this.p.distance(this.m.position),
          l = this.r(200, 250);

      if(d < l) {
        this.v.mul(d / l);
      }
    }

    // keep a copy of the current position, for a nice line between then and now and add velocity
    this.p.move(this.t).add(this.v.mul(.94)); // slow down the velocity slightly

    // wrap around the edges
    if(this.p.wrap2d(this.b)) {
      this.p.move(this.t);
    }
  };

  // plot the line, but do not stroke yet.
  pp.render = function() {
    //context.arc(this.p.x, this.p.y, 2, 0, Math.PI * 2, true); // circle
    context.lineWidth = this.particleTrailWidth;
    context.fillStyle = this.color;
    context.moveTo(this.p.x, this.p.y);
    context.lineTo(this.t.x, this.t.y);
  };


// Define mouse events functions
//
//
  var MouseMonitor = function(element) {
    this.position = new Vector2D(0, 0);
    this.state    = {left: false, middle: false, right: false};
    this.element  = element;

    var that = this;
    element.addEventListener('mousemove', function(event) {
      var dot, eventDoc, doc, body, pageX, pageY;
      event = event || window.event;
      if (event.pageX == null && event.clientX != null) {
        eventDoc = (event.target && event.target.ownerDocument) || document;
        doc = eventDoc.documentElement;
        body = eventDoc.body;
        event.pageX = event.clientX + (doc && doc.scrollLeft || body && body.scrollLeft || 0) - (doc && doc.clientLeft || body && body.clientLeft || 0);
        event.pageY = event.clientY + (doc && doc.scrollTop  || body && body.scrollTop  || 0) - (doc && doc.clientTop  || body && body.clientTop  || 0 );
      }

      that.position.x = event.pageX;
      that.position.y = event.pageY;
    });

    element.addEventListener('contextmenu', function(event) {
      return event.preventDefault();
    });

    element.addEventListener('mousedown', function(event) {
      if(event.which === 1) that.state.left = true;
      if(event.which === 2) that.state.middle = true;
      if(event.which === 3) that.state.right = true;

      return event.preventDefault();
    });

    element.addEventListener('mouseup', function(event) {
      that.state.left = that.state.middle = that.state.right = false;

      return event.preventDefault();
    });
  };


// Define functions
//
//
function generateColor() {
  let hexSet = "0123456789ABCDEF";
  let finalHexString = "#";
  for (let i = 0; i < 6; i++) {
    finalHexString += hexSet[Math.ceil(Math.random() * 15)];
  }
  return finalHexString;
}

function generateParticles(amount) {
  for (let i = 0; i < amount; i++) {
    particles.push(new Particle(
          innerWidth/2 + 200*Math.cos(Math.PI * 2 * i/amount),
          innerHeight/2 + 200*Math.sin(Math.PI * 2 * i/amount),
          bounds,
          1,
          generateColor(),
          0.02
        )
    );
  }
}

function render() {
    requestAnimationFrame(render);

    context.beginPath();
    // render each particle and trail
    for(var i = 0; i < particles.length; i += 1) {
      particles[i].step(), particles[i].render();
    }

    context.globalCompositeOperation = 'source-over';
    if(settings.fadeOverlay) {
      context.fillStyle = 'rgba(0, 0, 0, .085)';
    } else {
      context.fillStyle = 'rgba(0, 0, 0, 1)';
    }
    context.fillRect(0, 0, width, height);

    context.globalCompositeOperation = 'lighter';
    if(settings.rotateColor) {
      context.strokeStyle = 'hsla(' + hue + ', 75%, 50%, .55)';
    } else {
      context.strokeStyle = settings.staticColorString;
    }
    context.stroke();
    context.closePath();

    hue = ((hue + .5) % 360);
}


// Start on window load
//
//
canvas = document.getElementById("fireworksCanvas");
context = canvas.getContext("2d");
particles = [];
bounds = new Vector2D(0, 0),
canvas.width = bounds.x = window.innerWidth,
canvas.height = bounds.y = window.innerHeight,
monitor = new MouseMonitor(canvas),
hue = 0,
settings = {
    particleNum: 2000,
    fadeOverlay: true,
    rotateColor: true,
    staticColor: {r: 0, g: 75, b: 50},
    staticColorString: 'rgba(0, 75, 50, 0.55)'
};
width = canvas.width;
height = canvas.height;

window.addEventListener('load', function() {
      // generate a few particles
      generateParticles(settings.particleNum)
      console.log('Rendering...')
      // kick off animation
      render()
});