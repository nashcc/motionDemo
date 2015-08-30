(function() {
    var frameCount = 0;
    var utils = {
        curveThroughPoints: function( points, ctx ) {
            var i, n, a, b, x, y;

            for ( i = 1, n = points.length - 2; i < n; i++ ) {

                a = points[i];
                b = points[i + 1];

                x = ( a.x + b.x ) * 0.5;
                y = ( a.y + b.y ) * 0.5;

                ctx.quadraticCurveTo( a.x, a.y, x, y );
            }

            a = points[i];
            b = points[i + 1];

            ctx.quadraticCurveTo( a.x, a.y, b.x, b.y );
        },
        random: function( min, max ) {

            if ( Array.isArray( min ) ) {
                return min[ ~~( Math.random() * min.length ) ];
            }
            if ( typeof max !== 'number' ) {
                max = min || 1;
                min = 0;
            }

            return min + Math.random() * ( max - min );
        }
    };

    var settings = {
        darkTheme: true,
        headRadius: 60,
        thickness: 18,
        tentacles: 40,
        friction: 0.02,
        gravity: 0.5,
        colour: { h:0, s:0, v:0.8 },
        length: 70,
        wind: -0.5
    };
    var radius = settings.headRadius;
    var tentacles = [];
    var center = { x:0, y:0 };

    var Node = function( x, y ) {
        this.x = this.ox = x || 0.0;
        this.y = this.oy = y || 0.0;

        this.vx = 0.0;
        this.vy = 0.0;
    };

    var Tentacle = function( options ) {
        this.length   = options.length || 10;
        this.radius   = options.radius || 10;
        this.spacing  = options.spacing || 20;
        this.friction = options.friction || 0.8;
        this.shade    = utils.random( 0.85, 1.1 );

        this.nodes = [];
        this.outer = [];
        this.inner = [];
        this.theta = [];

        for ( var i = 0; i < this.length; i++ ) {
            this.nodes.push( new Node() );
        }
    };

    Tentacle.prototype = {

        move: function( x, y, instant ) {

            this.nodes[0].x = x;
            this.nodes[0].y = y;

            if ( instant ) {

                var i, node;

                for ( i = 1; i < this.length; i++ ) {

                    node = this.nodes[i];
                    node.x = x;
                    node.y = y;
                }
            }
        },

        update: function() {

            var i, j, s, c, dx, dy, da, px, py, node, prev = this.nodes[0];
            var radius = this.radius * settings.thickness;
            var step = radius / this.length;

            for ( i = 1, j = 0; i < this.length; i++, j++ ) {

                node = this.nodes[i];

                node.x += node.vx;
                node.y += node.vy;

                dx = prev.x - node.x;
                dy = prev.y - node.y;
                da = Math.atan2( dy, dx );

                px = node.x + Math.cos( da ) * this.spacing * settings.length;
                py = node.y + Math.sin( da ) * this.spacing * settings.length;

                node.x = prev.x - ( px - node.x );
                node.y = prev.y - ( py - node.y );

                node.vx = node.x - node.ox;
                node.vy = node.y - node.oy;

                node.vx *= this.friction * (1 - settings.friction);
                node.vy *= this.friction * (1 - settings.friction);

                node.vx += settings.wind;
                node.vy += settings.gravity;

                node.ox = node.x;
                node.oy = node.y;

                s = Math.sin( da + Math.PI/2 );
                c = Math.cos( da + Math.PI/2 );

                this.outer[j] = {
                    x: prev.x + c * radius,
                    y: prev.y + s * radius
                };

                this.inner[j] = {
                    x: prev.x - c * radius,
                    y: prev.y - s * radius
                };

                this.theta[j] = da;

                radius -= step;

                prev = node;
            }
        },

        draw: function( ctx ) {

            var h, s, v, e;

            s = this.outer[0];
            e = this.inner[0];

            this.nodes.forEach(function(node) {
                ctx.beginPath();
                ctx.arc(node.x, node.y , 2, 0, 2*Math.PI);
                ctx.stroke();
            });

            this.outer.forEach(function(node) {
                ctx.beginPath();
                ctx.arc(node.x, node.y , 2, 0, 2*Math.PI);
                ctx.stroke();
            });

            this.inner.forEach(function(node) {
                ctx.beginPath();
                ctx.arc(node.x, node.y , 2, 0, 2*Math.PI);
                ctx.stroke();
            });

            /*
            ctx.beginPath();
            ctx.moveTo( s.x, s.y );
            utils.curveThroughPoints( this.outer, ctx );
            utils.curveThroughPoints( this.inner.reverse(), ctx );
            ctx.lineTo( e.x, e.y );
            ctx.closePath();

            h = settings.colour.h * this.shade;
            s = settings.colour.s * 100 * this.shade;
            v = settings.colour.v * 100 * this.shade;

            ctx.fillStyle = 'hsl(' + h + ',' + s + '%,' + v + '%)';
            ctx.fill();
            */
            if ( settings.thickness > 2 ) {

                v += settings.darkTheme ? -10 : 10;

                ctx.strokeStyle = 'hsl(' + h + ',' + s + '%,' + v + '%)';
                ctx.lineWidth = 1;
                ctx.stroke();
            }
        }
    };

    function setup() {
        var scene = document.getElementById('scene');
        scene.width = window.innerWidth;
        scene.height = window.innerHeight;

        center.x = scene.width / 2;
        center.y = scene.height / 2;

        var tentacle,
            tentacleOptions = [
                {length: 20, radius: 1, spacing: 0.5, fiction: 0.88},
                {length: 15, radius: 0.5, spacing: 0.5, fiction: 0.7},
                {length: 10, radius: 0.75, spacing: 0.5, fiction: 0.8}
            ];

        for ( var i = 0; i < 3; i++ ) {
            /*tentacleOptions = {
                length: random( 10, 20 ),
                radius: random( 0.05, 1.0 ),
                spacing: random( 0.2, 1.0 ),
                friction: random( 0.7, 0.88 )
            };*/

            tentacle = new Tentacle(tentacleOptions[i]);

            tentacle.move( center.x, center.y, true );
            tentacles.push( tentacle );
        }
    }

    function updatePositions() {
        var t, cx, cy, pulse;

        t = this.millis * 0.001;

        t = this.millis;
        cx = this.width * 0.5;
        cy = this.height * 0.5;

        // center.x = cx + Math.sin( t * 0.002 ) * Math.cos( t * 0.00005 ) * cx * 0.5;
        // center.y = cy + Math.sin( t * 0.003 ) * Math.tan( Math.sin( t * 0.0003 ) * 1.15 ) * cy * 0.4;

        var px, py, theta, tentacle;
        // var step = (Math.PI*2) / settings.tentacles;
        var step = (Math.PI*2) / 3;

        //for ( var i = 0, n = settings.tentacles; i < n; i++ ) {
        for ( var i = 0, n = 1; i < n; i++ ) {

            tentacle = tentacles[i];

            theta = i * step;

            px = Math.cos( theta ) * radius;
            py = Math.sin( theta ) * radius;

            tentacle.move( center.x + px, center.y + py );
            tentacle.update();
        }
    }

    function draw() {
        updatePositions();
        var scene = document.getElementById('scene');
        var ctx = scene.getContext('2d');

        var h = settings.colour.h * 0.95;
        var s = settings.colour.s * 100 * 0.95;
        var v = settings.colour.v * 100 * 0.95;
        var w = v + ( settings.darkTheme ? -10 : 10 );

        ctx.clearRect(0, 0, scene.width, scene.height);
        ctx.beginPath();
        // ctx.arc( center.x, center.y, radius + settings.thickness, 0, Math.PI*2 );
        // ctx.lineWidth = settings.headRadius * 0.3;
        // ctx.globalAlpha = 0.2;
        // ctx.strokeStyle = 'hsl(' + h + ',' + s + '%,' + w + '%)';
        // ctx.stroke();

        ctx.globalAlpha = 1.0;

        //for ( var i = 0, n = settings.tentacles; i < n; i++ ) {
        for ( var i = 0, n = 1; i < n; i++ ) {
            tentacles[i].draw( ctx );
        }

        // ctx.beginPath();
        // ctx.arc( center.x, center.y, radius + settings.thickness, 0, Math.PI*2);
        // ctx.fillStyle = 'hsl(' + h + ',' + s + '%,' + v + '%)';
        // ctx.fill();

        window.requestAnimationFrame(draw);
    }

    document.addEventListener('DOMContentLoaded', function(event) {
        setup();
        window.requestAnimationFrame(draw);
        console.log(frameCount);
    });
})();


