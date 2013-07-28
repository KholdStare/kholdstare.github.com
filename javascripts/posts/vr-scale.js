var vec = function ( x, y, z )
{
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
    orthoCam.lookAt( vec( 0, 0, 0) );
    orthoCam.updateProjectionMatrix();

    var perspCam = new THREE.PerspectiveCamera(75, viewAspect, 0.1, 1000);
    perspCam.position.z = 10;
    perspCam.updateProjectionMatrix();

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
                fov: 150,
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
        sceneUpdateFun(scene);
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

    var halfFov = fov / 2;
    var fovLine = makeLine( vec(0, 0, 0), direction, THREE.LineStrip );

    var zAxis = vec( 0, 1, 0 );
    result.add( fovLine.clone().rotateOnAxis( zAxis, halfFov ) );
    result.add( fovLine.clone().rotateOnAxis( zAxis, -halfFov ) );

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

var initSphereScene = function (context)
{
    var scene = initLitScene();

    var radius = 2;
    var geometry = new THREE.SphereGeometry(radius, 20, 20);
    var material = new THREE.MeshPhongMaterial({color: 0xaaffaa});
    var sphere = new THREE.Mesh(geometry, material);
    scene.add(sphere);

    var sphereEdge = vec(-radius, 0, 0);
    var eyeOrigin = vec(0, 0, 10);

    scene.add( followSphere( eyeOrigin, vec( 0, 0, 0 ), radius ) );

    var fovGraphic = createFovGraphic( eyeOrigin, vec(0, 0, -30), context.persp.fov );
    scene.add(fovGraphic);

    // TODO: decouple scene from starting render
    var updateFun = function(sc)
    {
        sphere.rotation.x += 0.1;
        sphere.rotation.y += 0.1;
    };

    startRenderLoop(context, scene, updateFun);
};

initSphereScene( createDefaultContext( $("#scene-sphere").get(0), 2 ) );
