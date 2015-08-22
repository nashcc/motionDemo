
/**
 * Copyright (C) 2012 by Justin Windle
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */

var settings = {
    darkTheme: true,
    headRadius: 60,
    thickness: 18,
    tentacles: 40,
    friction: 0.02,
    gravity: 0.5,
    colour: { h:0, s:0, v:0.8 },
    length: 70,
    pulse: false,
    wind: -0.5
};

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
    }
};

var Node = function( x, y ) {
    
    this.x = this.ox = x || 0.0;
    this.y = this.oy = y || 0.0;

    this.vx = 0.0;
    this.vy = 0.0;
};

var Tentacle = function( options ) {

    this.length = options.length || 10;
    this.radius = options.radius || 10;
    this.spacing = options.spacing || 20;
    this.friction = options.friction || 0.8;
    this.shade = random( 0.85, 1.1 );

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

        var i, n, s, c, dx, dy, da, px, py, node, prev = this.nodes[0];
        var radius = this.radius * settings.thickness;
        var step = radius / this.length;

        for ( i = 1, j = 0; i < this.length; i++, j++ ) {

            node = this.nodes[i];

            node.x += node.vx;
            node.y += node.vy;

            dx = prev.x - node.x;
            dy = prev.y - node.y;
            da = Math.atan2( dy, dx );

            px = node.x + cos( da ) * this.spacing * settings.length;
            py = node.y + sin( da ) * this.spacing * settings.length;

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

            s = sin( da + HALF_PI );
            c = cos( da + HALF_PI );

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

        if ( settings.thickness > 2 ) {

            v += settings.darkTheme ? -10 : 10;

            ctx.strokeStyle = 'hsl(' + h + ',' + s + '%,' + v + '%)';
            ctx.lineWidth = 1;
            ctx.stroke();
        }
    }
};

var demo = true;
var ease = 0.1;
var modified = false;
var radius = settings.headRadius;
var tentacles = [];
var center = { x:0, y:0 };

var sketch = Sketch.create({

    container: document.getElementById( 'container' ),

    setup: function() {

        center.x = this.width / 2;
        center.y = this.height / 2;

        var tentacle;

        for ( var i = 0; i < 50; i++ ) {

            tentacle = new Tentacle({
                length: random( 10, 20 ),
                radius: random( 0.05, 1.0 ),
                spacing: random( 0.2, 1.0 ),
                friction: random( 0.7, 0.88 )
            });

            tentacle.move( center.x, center.y, true );
            tentacles.push( tentacle );
        }
    },

    update: function() {

        var t, cx, cy, pulse;

        t = this.millis * 0.001;

        t = this.millis;
        cx = this.width * 0.5;
        cy = this.height * 0.5;

        center.x = cx + sin( t * 0.002 ) * cos( t * 0.00005 ) * cx * 0.5;
        center.y = cy + sin( t * 0.003 ) * tan( sin( t * 0.0003 ) * 1.15 ) * cy * 0.4;

        var px, py, theta, tentacle;
        var step = TWO_PI / settings.tentacles;

        for ( var i = 0, n = settings.tentacles; i < n; i++ ) {

            tentacle = tentacles[i];

            theta = i * step;

            px = cos( theta ) * radius;
            py = sin( theta ) * radius;

            tentacle.move( center.x + px, center.y + py );
            tentacle.update();
        }
    },

    draw: function() {

        var h = settings.colour.h * 0.95;
        var s = settings.colour.s * 100 * 0.95;
        var v = settings.colour.v * 100 * 0.95;
        var w = v + ( settings.darkTheme ? -10 : 10 );

        this.beginPath();
        this.arc( center.x, center.y, radius + settings.thickness, 0, TWO_PI );
        this.lineWidth = settings.headRadius * 0.3;
        this.globalAlpha = 0.2;
        this.strokeStyle = 'hsl(' + h + ',' + s + '%,' + w + '%)';
        this.stroke();

        this.globalAlpha = 1.0;

        for ( var i = 0, n = settings.tentacles; i < n; i++ ) {
            tentacles[i].draw( this );
        }

        this.beginPath();
        this.arc( center.x, center.y, radius + settings.thickness, 0, TWO_PI );
        this.fillStyle = 'hsl(' + h + ',' + s + '%,' + v + '%)';
        this.fill();
    },


    save: function() {
        window.open( this.canvas.toDataURL(), 'tentacles', "top=20,left=20,width=" + this.width + ",height=" + this.height );
    }
});