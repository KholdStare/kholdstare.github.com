var globalShadows = true;
var globalDefaultColor = 0x7494e7;
var animScale = 700;

if ( ! Date.now ) {   
    Date.now = function() {  return +new Date(); }; 
};

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

var rotateYTowards = function( object, position )
{
    var dir = position.clone().sub(object.position).normalize();

    var cosAngle = dir.dot(vec(0, 0, -1));
    var sign = (object.position.x - position.x > 0) ? 1.0 : -1.0;

    object.rotation.y = sign * Math.acos(cosAngle);
};

var replaceChildren = function (object, newChildren)
{
    var children = object.children;
    var i = children.length;

    while (i--)
    {
        object.remove(children[i]);
    }

    i = newChildren.length;

    while (i--)
    {
        object.add(newChildren[i]);
    }
};

var createDefaultContext = function( canvasElem, isBinocular )
{
    isBinocular = typeof isBinocular !== 'undefined' ? isBinocular : false;
    if (isBinocular)
    {
        numCameras = 3;
    }
    else
    {
        numCameras = 2;
    }

    var viewWidth = Math.floor( canvasElem.width / numCameras );
    var viewAspect = 1;
    var aspect = viewAspect * numCameras;

    var orthoCam = new THREE.OrthographicCamera(-10, 10, (10/viewAspect), (-10/viewAspect), 1, 50);
    orthoCam.up = vec(0, 0, -1);
    orthoCam.position.y = 10;
    orthoCam.position.z = -10;
    orthoCam.lookAt( vec( 0, 0, -10) );
    orthoCam.updateProjectionMatrix();

    var perspCam = new THREE.PerspectiveCamera(75, viewAspect, 0.1, 50);

    var context =
        {
            canvas: canvasElem,
            aspect: aspect,
            renderer: new THREE.WebGLRenderer(
                                {
                                    canvas: canvasElem,
                                    antialias: true,
                                    alpha: false,
                                }
                            ),
            width: canvasElem.width,
            height: canvasElem.height,
            ortho:
            {
                background: new THREE.Color().setRGB( 0.5, 0.5, 0.7 ),
                left: 0,
                bottom: 0,
                width: 1/numCameras,
                height: 1.0,
                camera: orthoCam
            },
            persp:
            {
                fov: 75,
                background: new THREE.Color().setRGB( 0.7, 0.5, 0.5 ),
                left: 1/numCameras,
                bottom: 0,
                width: 1/numCameras,
                height: 1.0,
                camera: perspCam
            },
            perspRight:
            {
                fov: 75,
                background: new THREE.Color().setRGB( 0.7, 0.5, 0.5 ),
                left: 2/numCameras,
                bottom: 0,
                width: 1/numCameras,
                height: 1.0,
                camera: new THREE.PerspectiveCamera(75, viewAspect, 0.1, 50)
            }
        };

    // collect all views
    context.views = [context.ortho, context.persp];
    if (isBinocular)
    {
        context.views.push(context.perspRight);
        context.persp.camera.position.x = -2;
        context.perspRight.camera.position.x = 2;
    }

    var renderer = context.renderer;
    renderer.setSize(canvasElem.width, canvasElem.height);

    if (globalShadows)
    {
        renderer.shadowMapEnabled = true;
        renderer.shadowMapSoft = false;
        renderer.shadowCameraNear = 1;
        renderer.shadowCameraFar = 100;
        renderer.shadowCameraFov = 50;

        renderer.shadowMapBias = 0.0039;
        renderer.shadowMapDarkness = 0.5;
        renderer.shadowMapWidth = 256;
        renderer.shadowMapHeight = 256;
        renderer.physicallyBasedShading = true;
    }

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

    var views = context.views;
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

    var light = new THREE.SpotLight( 0xffffff, 1.5, 100 );
    // TODO: figure out why doesn't work in other positions
    light.position.set( 30, 40, 10 );
    light.castShadow = true;
    scene.add( light );

    light = new THREE.PointLight( 0xffffff, 0.2, 100 );
    light.position.set( -20, 30, 5 );
    scene.add( light );

    light = new THREE.AmbientLight( 0x505050 );
    scene.add( light );

    var geometry = new THREE.CubeGeometry(20, 1, 20);
    var material = new THREE.MeshLambertMaterial({color: globalDefaultColor});
    var plane = new THREE.Mesh(geometry, material);
    plane.position = vec(0, -4.7, -10);
    plane.receiveShadow = true;
    scene.add(plane);

    // TODO: replace text with texture on plane?
    //geometry =
        //new THREE.TextGeometry(
                //"GROUND",
                //{
                    //size: 10,
                    //height: 2
                //}
            //);
    //var groundText = new THREE.Mesh(geometry, material.clone());
    //scene.add(groundText);

    return scene;
};

var startRenderLoop = 
    function(timer, context, scene, numFrames)
    {
        window.clearInterval(timer);
        numFrames = typeof numFrames !== 'undefined' ? numFrames : 200;

        var render = function ()
        {
            scene.updateFun(context);
            renderScene(context, scene);
        };

        var currentFrame = numFrames;
        var fps = 25;
        var timeout = 1000 / fps;

        console.log("called on context! with numFrames" + numFrames)

        timer = setInterval(
            function ()
            {
                console.log("rendering frame " + currentFrame);
                // stop after numFrames
                if ( currentFrame <= 0 )
                {
                    window.clearInterval(timer);
                }

                if ( !document.webkitHidden )
                {
                    requestAnimationFrame( render );
                }
                currentFrame--;
            },
            timeout
        );
        return timer;
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
    var startTime = Date.now();

    return function () {
        return Date.now() - startTime;
    }
}();

var initSphereScene = function (context)
{
    var scene = initLitScene();

    var objects = new THREE.Object3D();

    var radius = 2;
    var geometry = new THREE.SphereGeometry(radius, 20, 20);
    var material = new THREE.MeshPhongMaterial({color: globalDefaultColor});
    var sphere = new THREE.Mesh(geometry, material);
    sphere.castShadow = true;
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
    scene.sphere = sphere; // save for later use
    scene.followGraphic

    scene.updateFun = function(context)
    {
        var t = getTick();
        var sinParam = Math.sin(t/animScale) + 1.3;

        sphere.position.z = -(sinParam * 10);
        sphere.scale = vec( sinParam );
    };

    return scene;
};

// Assumes eye is at origin. Makes a line of spheres all appear the same size
// from that view-point.
var createLineOfSpheres = function (startPosition, endPosition, num, radius)
{
    var objects = new THREE.Object3D();

    var geometry = new THREE.SphereGeometry(radius, 20, 20);
    var material = new THREE.MeshPhongMaterial({color: globalDefaultColor});
    var protoSphere = new THREE.Mesh(geometry, material);
    protoSphere.castShadow = true;

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

var createFollowLinesForSpheres = function (eyeOrigin, sphereObjectArray)
{
    var lines = [];

    for (ii = 0; ii < sphereObjectArray.length; ii++)
    {
        var sphere = sphereObjectArray[ii];

        lines[ii] = followSphere( eyeOrigin, sphere.position, sphere.radius );
    }

    return lines;
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
                vec(-6, 0, -18),
                vec(3.5, 0, -9),
                3,
                1
            );
    spheres.position.y = -1;
    objects.add(spheres);

    var eyeOrigin = vec();
    var fovGraphic = createFovGraphic( eyeOrigin, vec(0, 0, -100), context.persp.fov );
    objects.add(fovGraphic);

    var followGraphic = new THREE.Object3D();
    followGraphic.children = createFollowLinesForSpheres( eyeOrigin, spheres.children );
    objects.add(followGraphic);

    scene.add( objects );

    scene.updateFun = function(context)
    {
        var t = getTick();
        var sinParam = Math.sin(t/animScale) * 3;
        eyeOrigin.x = sinParam;

        context.persp.camera.position.x = sinParam;
        fovGraphic.position.x = sinParam;
        replaceChildren (
            followGraphic,
            createFollowLinesForSpheres (
                    eyeOrigin,
                    spheres.children
                )
            );
    };

    return scene;
};

var initConvergenceScene = function (context)
{
    var scene = initLitScene();

    var objects = new THREE.Object3D();

    var radius = 2;
    var geometry = new THREE.SphereGeometry(radius, 20, 20);
    var material = new THREE.MeshPhongMaterial({color: globalDefaultColor});
    var sphere = new THREE.Mesh(geometry, material);
    sphere.castShadow = true;
    sphere.position.z = -10;
    objects.add(sphere);

    var initGraphicForCamera = function( camera )
    {
        var eyeOrigin = camera.position.clone();

        var followGraphic = new THREE.Object3D();
        followGraphic.add(
            makeLine(
                eyeOrigin,
                sphere.position
            )
        );
        objects.add(followGraphic);

        //var fovGraphic = createFovGraphic( eyeOrigin, vec(0, 0, -100), context.persp.fov );
        //fovGraphic.position.y = 9;
        //objects.add(fovGraphic);

        return {
            line: followGraphic,
            //fov:  fovGraphic
        };
    };

    
    graphicLeft = initGraphicForCamera( context.persp.camera );
    graphicRight = initGraphicForCamera( context.perspRight.camera );

    scene.add( objects );
    scene.sphere = sphere; // save for later use

    var updateGraphicForCamera = function( camera, graphic )
    {
        replaceChildren (
            graphic.line,
            [makeLine(
                camera.position,
                sphere.position
                )]
            );

        //rotateYTowards(graphic.fov, sphere.position);
        rotateYTowards(camera, sphere.position);
    };

    scene.updateFun = function(context)
    {
        var t = getTick();
        var sinParam = Math.sin(t/animScale) + 1.3;

        sphere.position.z = -(sinParam * 10);
        sphere.scale = vec( sinParam );

        updateGraphicForCamera( context.persp.camera, graphicLeft );
        updateGraphicForCamera( context.perspRight.camera, graphicRight );
    };

    return scene;
};

var withCanvas = function( canvasId, initFunc, isBinocular )
{
    var canvasQuery = $(canvasId);
    var context = createDefaultContext( canvasQuery.get(0), isBinocular );
    var scene = initFunc( context );

    var timer;
    var starter = function()
    {
        timer = startRenderLoop(timer, context, scene);
    };

    canvasQuery.click(starter);
    renderScene(context, scene);
};

withCanvas( "#scene-sphere", initSphereScene );
withCanvas( "#scene-parallax", initParallaxScene );
withCanvas( "#scene-convergence", initConvergenceScene, true );
