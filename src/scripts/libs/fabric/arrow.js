// http://jsfiddle.net/matthze/n5Lwj/
/*globals exports */
/*eslint no-underscore-dangle:0 */
(function(global) {

    'use strict';

    var fabric = global.fabric || (global.fabric = {});
    var supportsLineDash = fabric.StaticCanvas.supports('setLineDash');

    if (fabric.Arrow) {
        fabric.warn('fabric.Arrow is already defined');
        return;
    }

    /**
     * Arrow class
     * @class fabric.Arrow
     * @extends fabric.Line
     * @see {@link fabric.Arrow#initialize} for constructor definition
     */
    fabric.Arrow = fabric.util.createClass(fabric.Line, /** @lends fabric.Line.prototype */ {

        /**
         * Type of an object
         * @type String
         * @default
         */
        type: 'arrow',

        /**
         * @private
         * @param {CanvasRenderingContext2D} ctx Context to render on
         */
        _render: function(ctx) {
            ctx.beginPath();

            var isInPathGroup = this.group && this.group.type === 'path-group';
            if (isInPathGroup && !this.transformMatrix) {
                ctx.translate( -this.group.width / 2 + this.left, -this.group.height / 2 + this.top);
            }

            if (!this.strokeDashArray || this.strokeDashArray && supportsLineDash) {

                // move from center (of virtual box) to its left/top corner
                // we can't assume x1, y1 is top left and x2, y2 is bottom right
                var xMult = (this.x1 <= this.x2) ? -1 : 1;
                var yMult = (this.y1 <= this.y2) ? -1 : 1;

                var mw = this.width / 2;
                var mh = this.height;

                var kw = this.width === 1 ? 0 : 1;
                var kh = this.height === 1 ? 0 : 1;

                var x0 = kw * xMult * mw;
                var y0 = kh * yMult * mh;

                var x1 = -1 * x0;
                var y1 = -1 * y0;

                if (x1 === x0 && y0 === y1) {
                    return;
                }

                ctx.setLineJoin('round');
                ctx.setLineCap('round');

                ctx.moveTo(x0, y0);

                ctx.lineTo(x1, y1);
                ctx.moveTo(x1 + ctx.lineWidth, y1);
                var dx = ctx.lineWidth * 3;
                var dy = ctx.lineWidth * 2;

                ctx.setStrokeColor('#656565');
                ctx.lineTo(x1 - dx, y1 - dy);
                ctx.lineTo(x1 + ctx.lineWidth, y1);
                ctx.lineTo(x1 - dx, y1 + dy);
            }

            ctx.lineWidth = this.strokeWidth;

            // TODO: test this
            // make sure setting "fill" changes color of a line
            // (by copying fillStyle to strokeStyle, since line is stroked, not filled)
            var origStrokeStyle = ctx.strokeStyle;
            ctx.strokeStyle = this.stroke || ctx.fillStyle;
            this._renderStroke(ctx);
            ctx.strokeStyle = origStrokeStyle;
        }
    });

    fabric.Arrow.fromObject = function(object) {
        var points = [object.x1, object.y1, object.x2, object.y2];
        return new fabric.Arrow(points, object);
    };

}(typeof exports !== 'undefined' ? exports : this));
