define([
    '/scripts/libs/class.js'
], function (Class) {

    var canvas = function(r) {
        var c = document.createElement('CANVAS');
        c.width = r.width;
        c.height = r.height;
        return c;
    };

    var noop = function(f) {
        return f || function() {};
    };

    var ToolBase = Class.extend({

        init: function(scene, options) {
            this.scene = scene;
            this.options = options;
            this.onFinalize = $.Callbacks();
            this.onFinalize.add(this.applyImage.bind(this));
        },

        api: function() {
            var prmCtx = this.scene.primary.context;
            var slv = this.scene.layer();
            var slvCtx = this.scene.slave.context;

            slvCtx.exClear = function() {
                slvCtx.clearRect(0, 0, slv.width, slv.height);
            };

            slvCtx.exApply = function() {
                prmCtx.drawImage(slv, 0, 0);
                slvCtx.exClear();
            };
            return slvCtx;
        },

        applyImage: function () {
            this.api().exApply();
        }
    });

    var ToolDnDBase = ToolBase.extend({

        init: function(scene, options) {
            this._super(scene, options);

            this.subscribeToEvents = 'mousedown mousemove mouseup';
            $(this.scene.layer())
                .on(this.subscribeToEvents,
                    this.commonMousePatternHandler.bind(this));
        },

        destroy: function() {
            $(this.scene.layer())
                .off(this.subscribeToEvents);
        },

        commonMousePatternHandler: function(ev) {

            var tool = this;
            ev._x = ev.offsetX;
            ev._y = ev.offsetY;

            var methodsMap = {
                mousedown: function(e) {
                    tool.started = true;
                    tool.x0 = ev._x;
                    tool.y0 = ev._y;
                    noop(tool.mousedown).bind(tool)(e);
                },
                mousemove: function(e) {
                    if (tool.started) {
                        noop(tool.mousemove).bind(tool)(e);
                    }
                },
                mouseup: function(e) {
                    noop(tool.mouseup).bind(tool)(ev);
                    tool.started = false;
                    noop(tool.mouseup).bind(tool)(e);

                    tool.onFinalize.fire();
                }
            };

            methodsMap[ev.type](ev);
        }
    });

    var Rect = ToolDnDBase.extend({

        name: 'rect',

        mousemove: function (ev) {
            var tool = this;
            var x = Math.min(ev._x, tool.x0),
                y = Math.min(ev._y, tool.y0),
                w = Math.abs(ev._x - tool.x0),
                h = Math.abs(ev._y - tool.y0);

            this.api().exClear();

            if (!w || !h) {
                return;
            }

            this.api().strokeRect(x, y, w, h);
        }
    });

    var Line = ToolDnDBase.extend({

        name: 'line',

        mousemove: function (ev) {
            var tool = this;
            var api = this.api();
            api.exClear();
            api.beginPath();
            api.moveTo(tool.x0, tool.y0);
            api.lineTo(ev._x, ev._y);
            api.stroke();
            api.closePath();
        }
    });

    var Circ = ToolDnDBase.extend({

        name: 'circle',

        mousemove: function (ev) {
            var tool = this;
            var api = this.api();

            var dx = Math.abs(ev._x - tool.x0),
                dy = Math.abs(ev._y - tool.y0),
                x = Math.min(ev._x, tool.x0) + Math.round(dx / 2),
                y = Math.min(ev._y, tool.y0) + Math.round(dy / 2),
                r = Math.round(Math.sqrt(Math.pow(dx, 2) + Math.pow(dy, 2)));

            api.exClear();

            var startingAngle = 0;
            var endingAngle = 2 * Math.PI; // 360 degrees is equal to 2Ï€ radians

            var circumference = Math.max(dx, dy);
            var scaleX = dx / circumference;
            var scaleY = dy / circumference;

            if (!x || !y || !r || !circumference || !scaleX || !scaleY) {
                return;
            }

            api.save();
            api.translate(x, y);
            api.scale(scaleX, scaleY);
            api.beginPath();
            api.arc(0, 0, r, startingAngle, endingAngle, false);
            api.stroke();
            api.closePath();
            api.restore();
        }
    });

    var Eraser = ToolDnDBase.extend({

        name: 'eraser',

        mousedown: function (ev) {
            var api = this.api();
            api.beginPath();
            api.moveTo(ev._x, ev._y);
        },

        mousemove: function (ev) {
            var api = this.api();
            api.lineTo(ev._x, ev._y);
            api.stroke();
        }
    });

    var Pencil = ToolDnDBase.extend({

        name: 'pencil',

        mousedown: function (ev) {
            var api = this.api();
            api.beginPath();
            api.moveTo(ev._x, ev._y);
        },

        mousemove: function (ev) {
            var api = this.api();
            api.lineTo(ev._x, ev._y);
            api.stroke();
        }
    });

    var Arrow = ToolDnDBase.extend({

        name: 'arrow',

        drawArrowhead: function(api, ex, ey, angle, sizex, sizey) {
            api.save();

            api.fillStyle = this.options.color;

            var hx = sizex / 2;
            var hy = sizey / 2;

            api.translate(ex, ey);
            api.rotate(angle);
            api.translate(-hx, -hy);

            api.beginPath();
            api.moveTo(0,0);
            api.lineTo(0, sizey);
            api.lineTo(sizex, hy);
            api.closePath();
            api.fill();

            api.restore();
        },

        findAngle: function(sx, sy, ex, ey) {
            // make sx and sy at the zero point
            return Math.atan((ey - sy) / (ex - sx));
        },

        mousemove: function (ev) {
            var tool = this;
            var api = this.api();

            var sx = tool.x0;
            var sy = tool.y0;
            var ex = ev._x;
            var ey = ev._y;

            api.exClear();
            api.beginPath();
            api.moveTo(sx, sy);
            api.lineTo(ex, ey);
            api.stroke();
            api.closePath();

            var ang = this.findAngle(sx, sy, ex, ey);
            this.drawArrowhead(api, ex, ey, ang, 16, 16);
        }
    });

    var Text = ToolBase.extend({

        name: 'text',

        init: function(scene, options) {
            this._super(scene, options);

            this.subscribeToEvents = 'click';
            $(this.scene.layer())
                .on(this.subscribeToEvents,
                    this.commonMousePatternHandler.bind(this));
        },

        destroy: function() {
            $(this.scene.layer())
                .off(this.subscribeToEvents);
        },

        commonMousePatternHandler: function(ev) {
            var tool = this;
            ev._x = ev.offsetX;
            ev._y = ev.offsetY;

            if (tool.started && !$(ev.target).hasClass('i-role-text-editor')) {
                tool.onEnter();
            }
            else {
                tool.started = true;
                tool.x0 = ev._x;
                tool.y0 = ev._y;
                noop(tool.onClick).bind(tool)(ev);
            }
        },

        onClick: function (ev) {
            var tool = this;

            this.textBox = $('<div></div>')
                .addClass('i-role-text-editor')
                .css({
                    position:'absolute',
                    left: tool.x0 + 'px',
                    top: tool.y0 + 'px',
                    border: 'dotted 1px red',
                    color: this.options.color,
                    font: this.options.font,
                    padding: '0 0 0 0'
                })
                .attr('contenteditable', true)
                .appendTo($(this.scene.layer()).parent());

            this.textBox.focus();

            this.textBox
                .on('keydown', function(e) {
                    if (e.ctrlKey && e.which === 13) {
                        this.onEnter();
                    }
                    else if (e.which === 27) {
                        this.onEscape();
                    }
                }.bind(this));
        },

        onEnter: function() {
            var tool = this;
            var height = this.textBox.height();
            var text = this.textBox.html();
            this.textBox.remove();

            var textLines = text
                .replace(/<div>/gi, '\n')
                .replace(/<\/div>/gi, '')
                .replace(/<br>/gi, '')
                .replace(/<br\/>/gi, '')
                .split('\n');

            tool.started = false;

            this.drawMultiLineText(textLines, {
                x: tool.x0,
                y: tool.y0,
                dy: height / textLines.length
            });

            tool.onFinalize.fire();
        },

        onEscape: function() {
            this.textBox.remove();
            this.started = false;
        },

        drawMultiLineText: function(texts, coords) {
            var api = this.api();

            var sx = coords.x;
            var sy = coords.y;
            var dy = coords.dy;

            api.exClear();
            api.fillStyle = this.options.color;
            api.font = this.options.font;
            api.textBaseline = 'top';
            api.textAlign = 'left';

            for (var i = 0, delta = 0; i < texts.length; i++) {
                api.fillText(texts[i], sx, delta + sy);
                delta += dy;
            }
        }
    });

    var Crop = ToolBase.extend({

        name: 'crop',

        init: function(scene, options) {
            this._super(scene, options);

            this.started = true;
            this.rect = {};
            $(this.scene.layer()).imgAreaSelect({
                handles: true,
                onSelectStart: this.createToolTip.bind(this),
                onSelectEnd: function (img, selection) {
                    this.rect = selection;
                }.bind(this)
            });

            $(document).on('keydown.crop', function(e) {
                if (e.which === 27) {
                    this.onEscape();
                }
            }.bind(this));
        },

        destroy: function() {
            this.started = false;
            $(document).off('.crop');
            $(this.scene.layer()).imgAreaSelect({ remove: true });
        },

        createToolTip: function() {
            var $tooltip = $('.i-role-img-area-select-box-tooltip');
            if (!$tooltip.length) {
                $tooltip = $('<div><a class="i-role-action-crop" style="color:white;" href="#">crop</a></div>');
                $tooltip
                    .addClass('i-role-img-area-select-box-tooltip')
                    .css({
                        width: '50px',
                        height: '25px',
                        'background-color': 'rgba(0,25,0, 0.25)',
                        left: '1px',
                        top: '1px',
                        position: 'absolute',
                        'text-align': 'center',
                        color: 'white',
                        'border-radius': '5px'
                    });

                $tooltip.on('click', '.i-role-action-crop', this.onEnter.bind(this));
                $('.i-role-img-area-select-box').append($tooltip);
            }
        },

        removeToolTip: function() {
            $('.i-role-img-area-select-box-tooltip').remove();
        },

        onEnter: function() {
            var r = this.rect;

            this.removeToolTip();
            $(this.scene.layer()).imgAreaSelect({ hide: true });

            var tmpCnvs = canvas(r);
            tmpCnvs
                .getContext('2d')
                .drawImage(this.scene.canvas(), r.x1, r.y1, r.width, r.height, 0, 0, r.width, r.height);

            this.scene.resize(r);
            this.api().drawImage(tmpCnvs, 0, 0);
            this.api().exApply();
        },

        onEscape: function() {
            $(this.scene.layer()).imgAreaSelect({ hide: true });
        }
    });

    function ToolKit(primaryCanvas, slaveCanvas) {
        var tools = this;

        this.options = {};

        this.primaryCanvas = primaryCanvas;
        this.slaveCanvas = slaveCanvas;

        tools.rect = Rect;
        tools.line = Line;
        tools.circle = Circ;
        tools.eraser = Eraser;
        tools.pencil = Pencil;
        tools.arrow = Arrow;
        tools.text = Text;
        tools.crop = Crop;
    }

    ToolKit.prototype = {

        create: function(toolName) {
            var self = this;
            var scene = {
                primary: this.primaryCanvas,
                slave: this.slaveCanvas,
                resize: function(r) {
                    this.primary.resize(r);
                    this.slave.resize(r);

                    this.slave.context.font = self.options.font;
                    this.slave.context.strokeStyle = self.options.color;
                    this.slave.context.lineWidth = self.options.width;
                },
                canvas: function() {
                    return this.primary.canvas;
                },
                layer: function() {
                    return this.slave.canvas;
                }
            };
            return new this[toolName](scene, this.options);
        },

        setFont: function(font) {
            this.options.font = font;
            this.slaveCanvas.context.font = font;
            return this;
        },

        setColor: function(color) {
            this.options.color = color;
            this.slaveCanvas.context.strokeStyle = color;
            return this;
        },

        setLine: function(width) {
            this.options.width = width;
            this.slaveCanvas.context.lineWidth = width;
            return this;
        }
    };

    return ToolKit;
});