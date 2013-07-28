var vec = function ( x, y, z )
{
    x = typeof x !== 'undefined' ? x : 0;
    y = typeof y !== 'undefined' ? y : x;
    z = typeof z !== 'undefined' ? z : y;
    return new THREE.Vector3( x, y, z );
};

var makeLine = function( start, end, type )
{
    type = typeof type !== 'undefined' ? type : THREE.LinePieces;
    return new THREE.Line(
                        lineGeometry( start, end, 11 ),
                        new THREE.LineBasicMaterial( {linewidth: 2} ),
                        type
                    );
};

var createDefaultContext = function( canvasElem, aspect )
{
    var viewWidth = Math.floor( canvasElem.width / 2 );
    var viewAspect = aspect / 2;

    var orthoCam = new THREE.OrthographicCamera(-10, 10, (-10/viewAspect), (10/viewAspect), 1, 1000);
    orthoCam.up = vec(0, 0, 1);
    orthoCam.position.y = -5;
    orthoCam.position.z = -10;
    orthoCam.lookAt( vec( 0, 0, -10) );
    orthoCam.updateProjectionMatrix();

    var perspCam = new THREE.PerspectiveCamera(75, viewAspect, 0.1, 1000);

    var context =
        {
            canvas: canvasElem,
            aspect: aspect,
            renderer: new THREE.WebGLRenderer(
                                {
                                    canvas: canvasElem,
                                    antialias: true,
                                    alpha: false
                                }
                            ),
            width: canvasElem.width,
            height: canvasElem.height,
            ortho:
            {
                background: new THREE.Color().setRGB( 0.5, 0.5, 0.7 ),
                left: 0,
                bottom: 0,
                width: 0.5,
                height: 1.0,
                camera: orthoCam
            },
            persp:
            {
                fov: 75,
                background: new THREE.Color().setRGB( 0.7, 0.5, 0.5 ),
                left: 0.5,
                bottom: 0,
                width: 0.5,
                height: 1.0,
                camera: perspCam
            }
        }

    context.renderer.setSize(canvasElem.width, canvasElem.height);

    return context;
};

var renderScene = function( context, scene )
{
    var canvasElem = context.canvas;
    var width = $(canvasElem).parent().width();
    var height = width / context.aspect;

    // make canvas responsive
    if (width != context.width || height != context.height)
    {
        context.width = width;
        context.height = height;
        context.renderer.setSize(width, height);
    }

    var views = [context.ortho, context.persp];
    var renderer = context.renderer;

    for (var ii = 0; ii < views.length; ii++)
    {
        var view = views[ii];
        var viewLeft   = Math.floor(context.width  * view.left);
        var viewBottom = Math.floor(context.height * view.bottom);
        var viewWidth  = Math.floor(context.width  * view.width);
        var viewHeight = Math.floor(context.height * view.height);
        renderer.setViewport( viewLeft, viewBottom, viewWidth, viewHeight );
        renderer.setScissor( viewLeft, viewBottom, viewWidth, viewHeight );
        renderer.enableScissorTest ( true );
        renderer.setClearColor( view.background );

        view.camera.updateProjectionMatrix();

        renderer.render(scene, view.camera);
    }
};

var lineGeometry = function ( startVertex, endVertex, segments )
{
    var geometry = new THREE.Geometry();
    for (i = 0; i < segments+1; i++)
    {
        alpha = i / segments;
        geometry.vertices.push( startVertex.clone().lerp( endVertex, alpha ) );
    }
    return geometry;
};

var initLitScene = function()
{
    var scene = new THREE.Scene();

    var light = new THREE.PointLight( 0xffffff, 1, 100 );
    light.position.set( 30, 40, 10 );
    scene.add( light );

    light = new THREE.AmbientLight( 0x404040 );
    scene.add( light );

    return scene;
};

var startRenderLoop = function(context, scene, sceneUpdateFun)
{
    var render = function ()
    {
        requestAnimationFrame(render);
        sceneUpdateFun(context, scene);
        renderScene(context, scene);
    };
    render();
};

// fov graphic for orthographic view
// assumes orthographic view pointing down
// on the y axis
var createFovGraphic = function( origin, direction, fov )
{
    var result = new THREE.Object3D();

    var radianRotation = (fov / 360) * Math.PI;
    var fovLine = makeLine( vec(0, 0, 0), direction, THREE.LineStrip );

    var zAxis = vec( 0, 1, 0 );
    result.add( fovLine.clone().rotateOnAxis( zAxis, radianRotation ) );
    result.add( fovLine.clone().rotateOnAxis( zAxis, -radianRotation ) );

    result.position = origin;

    return result;
};

// sphere following graphic for orthographic view
// assumes orthographic view pointing down on the y axis
var followSphere = function( eyeOrigin, sphereCenter, radius )
{
    var yAxis = vec( 0, 1, 0 );
    var result = new THREE.Object3D();

    var direction = new THREE.Vector3();
    direction.subVectors(sphereCenter, eyeOrigin);

    var sideVector = new THREE.Vector3();
    sideVector.crossVectors( direction, yAxis );
    sideVector.setLength( radius );

    var fovLine = makeLine( eyeOrigin, sphereCenter.clone().add(sideVector) );
    result.add(fovLine);
    fovLine = makeLine( eyeOrigin, sphereCenter.clone().add(sideVector.negate()) );
    result.add(fovLine);

    return result;
};

var getTick = function ()
{
    var startTime = new Date().getTime();

    return function () {
        return new Date().getTime() - startTime;
    }
}();

var initSphereScene = function (context)
{
    var scene = initLitScene();

    var objects = new THREE.Object3D();

    var radius = 2;
    var geometry = new THREE.SphereGeometry(radius, 20, 20);
    var material = new THREE.MeshPhongMaterial({color: 0xaaffaa});
    var sphere = new THREE.Mesh(geometry, material);
    sphere.position.z = -10;
    objects.add(sphere);

    var eyeOrigin = vec();

    var followGraphic =
        followSphere(
                eyeOrigin,
                sphere.position.clone().multiplyScalar(2),
                2*radius
            );
    objects.add(followGraphic);

    var fovGraphic = createFovGraphic( eyeOrigin, vec(0, 0, -100), context.persp.fov );
    objects.add(fovGraphic);

    scene.add( objects );

    var animScale = 700;

    // TODO: decouple scene from starting render
    var updateFun = function(context, scene)
    {
        var t = getTick();

        var sinParam = Math.sin(t/animScale) + 1.3;

        sphere.position.z = -(sinParam * 10);
        sphere.scale = vec( sinParam );
    };

    startRenderLoop(context, scene, updateFun);
};

// Assues eye is at origin. Makes a line of spheres all appear the same size
// from that view-point.
var createLineOfSpheres = function (startPosition, endPosition, num, radius)
{
    var objects = new THREE.Object3D();

    var geometry = new THREE.SphereGeometry(radius, 20, 20);
    var material = new THREE.MeshPhongMaterial({color: 0xaaffaa});
    var protoSphere = new THREE.Mesh(geometry, material);

    // line up several spheres so they appear the same size
    var middleZ = (startPosition.z + endPosition.z) / 2;
    var numSpheres = 3;

    for (sphereIndex = 0; sphereIndex < numSpheres; sphereIndex++)
    {
        var sphere = protoSphere.clone();
        var alpha = sphereIndex / (numSpheres - 1);

        sphere.position = startPosition.clone().lerp( endPosition, alpha );
        var scale = sphere.position.z / middleZ;
        sphere.scale = vec( scale );
        sphere.radius = radius * scale;
        sphere.position.x *= scale;

        objects.add(sphere);
    }

    return objects;
};

var initParallaxScene = function (context)
{
    var scene = initLitScene();
    var objects = new THREE.Object3D();

    // line up several spheres so they appear the same size
    var startVector = vec(-4, 0, -17);
    var endVector = vec(4, 0, -11);

    var spheres =
        createLineOfSpheres(
                vec(-4, 0, -17),
                vec(4, 0, -11),
                3,
                1
            );
    objects.add(spheres);

    var eyeOrigin = vec();
    var fovGraphic = createFovGraphic( eyeOrigin, vec(0, 0, -100), context.persp.fov );
    objects.add(fovGraphic);

    scene.add( objects );

    var animScale = 700;

    // TODO: decouple scene from starting render
    var updateFun = function(context, scene)
    {
        var t = getTick();
        var sinParam = Math.sin(t/animScale) * 3;

        context.persp.camera.position.x = sinParam;
        fovGraphic.position.x = sinParam;
    };

    startRenderLoop(context, scene, updateFun);
};

var withCanvas = function( canvasId, initFunc )
{
    initFunc( createDefaultContext( $(canvasId).get(0), 2 ) );
};

withCanvas( "#scene-sphere", initSphereScene );
withCanvas( "#scene-parallax", initParallaxScene );
