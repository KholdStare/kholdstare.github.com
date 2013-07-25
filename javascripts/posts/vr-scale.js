var vec = function ( x, y, z )
{
    return new THREE.Vector3( x, y, z );
};

var createDefaultContext = function( canvasElem ) // w/h should be deduced!
{
    var viewWidth = Math.floor( canvasElem.width / 2 );
    var viewAspect = viewWidth/canvasElem.height;

    var orthoCam = new THREE.OrthographicCamera(-10, 10, (-10/viewAspect), (10/viewAspect), 1, 1000);
    orthoCam.position.y = 5;
    orthoCam.lookAt( vec( 0, -1, 0) );
    orthoCam.up = vec(0, 0, -1);

    var perspCam = new THREE.PerspectiveCamera(75, viewAspect, 0.1, 1000);
    perspCam.position.z = 5;

    var context =
        {
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
                width: viewWidth,
                height: canvasElem.height,
                camera: orthoCam
            },
            persp:
            {
                background: new THREE.Color().setRGB( 0.7, 0.5, 0.5 ),
                left: viewWidth,
                bottom: 0,
                width: canvasElem.width - viewWidth,
                height: canvasElem.height,
                camera: perspCam
            }
        }

    context.renderer.setSize(canvasElem.width, canvasElem.height);

    return context;
};

var renderScene = function( context, scene )
{
    var views = [context.ortho, context.persp];
    var renderer = context.renderer;

    for (var ii = 0; ii < views.length; ii++)
    {
        var view = views[ii];
        renderer.setViewport( view.left, view.bottom, view.width, view.height );
        renderer.setScissor( view.left, view.bottom, view.width, view.height );
        renderer.enableScissorTest ( true );
        renderer.setClearColor( view.background );
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

var initSphereCanvas = function (context)
{
    var scene = new THREE.Scene();

    var geometry = new THREE.SphereGeometry(2, 20, 20);
    var material = new THREE.MeshPhongMaterial({color: 0xaaffaa});
    var sphere = new THREE.Mesh(geometry, material);
    scene.add(sphere);

    var line = new THREE.Line(
                        lineGeometry( vec(-10, 0, 0), vec(0, 0, 0), 11 ),
                        new THREE.LineBasicMaterial( {linewidth: 2} )
                    );
    scene.add(line);

    var light = new THREE.PointLight( 0xffffff, 1, 100 );
    light.position.set( 30, 40, 10 );
    scene.add( light );

    light = new THREE.AmbientLight( 0x404040 );
    scene.add( light );

    var render = function ()
    {
        requestAnimationFrame(render);
        sphere.rotation.x += 0.1;
        sphere.rotation.y += 0.1;
        renderScene(context, scene);
        //perspRenderer.render(scene, persp);
    };
    render();
};

initSphereCanvas( createDefaultContext( $("#scene-sphere").get(0), 400, 200 ) );
