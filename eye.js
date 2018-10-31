var $ = document.querySelector.bind(document);

var sync = true;
var canvasSize = 4200.0;
#var host = "192.168.1.7"
#var host = "172.20.10.1"
var host = "100.25.254.118"
/*
* p1 1, 21.0 
* p2 24.5, 3.0
* p3 16, 16.0
* p4 16, 24.5
* p5 30, 24.0
* p6 3, 5.5
* p7 12, 2.5

var configs = {'1': {'x':0, 'y':1256.0*2.0-1584.0},
               '2': {'x':1256.0, 'y':1256.0*2.0-1584.0},
               'p1': {'x':1000.0-1536.0/2.0, 'y':1000.0-1818.0/2.0}, // middle
               'p2': {'x':1000.0-1536.0/2.0, 'y':1000.0-1818.0/2.0}, // middle
               'p3': {'x':1000.0-1536.0/2.0, 'y':1000.0-1818.0/2.0}, // middle
               'p4': {'x':1000.0-1536.0/2.0, 'y':1000.0-1818.0/2.0}, // middle
               'p5': {'x':1000.0-1536.0/2.0, 'y':1000.0-1818.0/2.0}, // middle
               'p6': {'x':1000.0-1536.0/2.0, 'y':1000.0-1818.0/2.0}, // middle
               'p7': {'x':1000.0-1536.0/2.0, 'y':1000.0-1818.0/2.0} // middle
              }
*/
/*
var configs = {'p1': {'x':4.0,  'y':22.0},
               'p2': {'x':27.0, 'y':6.0},
               'p3': {'x':20.0, 'y':14.0},
               'p4': {'x':19.0, 'y':28.0},
               'p5': {'x':29.0, 'y':27.0},
               'p6': {'x':6.0,  'y':12.0},
               'p7': {'x':11.0, 'y':5.0}
              }
*/
var configs = {'p3': {'x':19.0, 'y':19.0},
               'p4': {'x':19.0, 'y':11.0},
               'p5': {'x':19.0, 'y':3.0},
               'p6': {'x':2.0, 'y':15.0},
               'p7': {'x':2.0, 'y':6.0}
              }

var pixPerCM = 128.0;
var urlParams = new URLSearchParams(window.location.search);
var clientName = urlParams.get('name');
var clientConfig = configs[clientName]

var firstSend = false;

console.log("Config " + clientConfig);

var camera = new THREE.Camera();
camera.position.z = 1;

var scene = new THREE.Scene();

var geometry = new THREE.PlaneBufferGeometry(2, 2);

var uniforms = {
  time: { type: "f", value: 1.0 },
  vieworigin: { type: "v2", value: new THREE.Vector2() },  
  resolution: { type: "v2", value: new THREE.Vector2() },
  mouse: { type: "v2", value: new THREE.Vector2() },
};

var material = new THREE.ShaderMaterial({
  uniforms: uniforms,
  vertexShader: $('#vs').text,
  fragmentShader: $('#fs').text,
});

var mesh = new THREE.Mesh(geometry, material);
scene.add(mesh);

var renderer = new THREE.WebGLRenderer();
$('body').appendChild(renderer.domElement);
renderer.domElement.addEventListener('mousemove', recordMousePosition);

function sendReady(time) {
  if (sync) {
    var msg;
    if (firstSend) {
      msg = clientName + " " + renderer.domElement.width + " "
        + renderer.domElement.height
      firstSend = false;
    } else {
      msg = clientName;
    }
    websocket.send(msg);
  } else {
    render(time);
  }
}

websocket = new WebSocket("ws://" + host + ":9000");

function waitForConnect(socket, callback) {
  setTimeout(
    function () {
      if (socket.readyState === 1) {
        console.log("Connection is made")
        if (callback != null) {
          callback(0);
        }
        return;
      } else {
        console.log("wait for connection...")
        waitForConnect(socket, callback);
      }
    }, 1000); // wait 5 milisecond for the connection...
}

websocket.onmessage = function (event) {
  time = parseFloat(event.data);
  render(time);
}

websocket.onclose = function (event) {
  setTimeout(function() {
    window.location.reload();
  }, 5000);
}

if (sync) {
  waitForConnect(websocket, function() { sendReady(0) });
} else {
  render(0);
}

function recordMousePosition(e) {
  // normalize the mouse position across the canvas
  // so in the shader the values go from -1 to +1
  var canvas = renderer.domElement;
  var rect = canvas.getBoundingClientRect();

  uniforms.mouse.value.x = (e.clientX - rect.left) / canvas.clientWidth  *  2 - 1;
  uniforms.mouse.value.y = (e.clientY - rect.top ) / canvas.clientHeight * -2 + 1;      
}

function resize() {
  var canvas = renderer.domElement;
  var dpr    = window.devicePixelRatio;  // make 1 or less if too slow
  var width  = canvas.clientWidth  * dpr;
  var height = canvas.clientHeight * dpr;
  if (width != canvas.width || height != canvas.height) {
    renderer.setSize( width, height, false );
    firstSend = true;
    console.log("set size " + width + " " + height + " dpr " + dpr);
    console.log("canvas size " + canvas.width + " " + canvas.height);
    uniforms.vieworigin.value.x = clientConfig.x*pixPerCM;
    uniforms.vieworigin.value.y = clientConfig.y*pixPerCM;
    uniforms.resolution.value.x = canvasSize;
    uniforms.resolution.value.y = canvasSize;
  }
}

function render(time) {
  resize();
  uniforms.time.value = time * 0.001;
  renderer.render(scene, camera);
  requestAnimationFrame(sendReady);
}

