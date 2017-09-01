import JsonConverter from "../JsonConverter.js";
import Rect from "../Rect.js";
import DockLocation from "../DockLocation.js";
import Border from "./BorderNode.js";
import Orientation from "../Orientation.js";

class BorderSet {
    constructor(model) {
        this._model = model;
        this._borders = [];
    }

    getBorders() {
        return this._borders;
    }

    _forEachNode(fn) {

        for (let i=0; i<this._borders.length; i++) {
            const borderNode = this._borders[i];
            fn(borderNode);
            borderNode._children.forEach((node) => {
                node._forEachNode(fn);
            })
        }
    }

    _toJson() {
        const json = [];
        for (let i = 0; i < this._borders.length; i++) {
            json.push(this._borders[i]._toJson());
        }
        return json;
    }

    static _fromJson(json, model) {
        const borderSet = new BorderSet(model);
        for (let i = 0; i < json.length; i++) {
            const borderJson = json[i];
            borderSet._borders.push(Border._fromJson(borderJson, model));
        }

        return borderSet;
    }

    _layout(outerInnerRects) {

        const rect = outerInnerRects.outer;
        const height = rect.height;
        const width = rect.width;
        let sumHeight = 0;
        let sumWidth = 0;
        let countHeight = 0;
        let countWidth = 0;
        let adjustableHeight = 0;
        let adjustableWidth = 0;

        const showingBorders = this._borders.filter((border) => border.isShowing());

        // sum size of borders to see they will fit
        for (var i = 0; i < showingBorders.length; i++) {
            var border = showingBorders[i];
            if (border.isShowing()) {
                border._setAdjustedSize(border._size);
                const visible = border.getSelected() != -1;
                if (border.getLocation().getOrientation() == Orientation.HORZ) {
                    sumWidth += border.getBorderBarSize() + this._model.getSplitterSize();
                    if (visible) {
                        sumWidth += border._size;
                        adjustableWidth += border._size;
                    }
                    countWidth++;
                }
                else {
                    sumHeight += border.getBorderBarSize() + this._model.getSplitterSize();
                    if (visible) {
                        sumHeight += border._size;
                        adjustableHeight += border._size;
                    }
                    countHeight++;
                }
            }
        }

        // adjust border sizes if too large
        var i = 0;
        while ((sumWidth > width && adjustableWidth > 0)
        || (sumHeight > height && adjustableHeight > 0)) {
            var border = showingBorders[i];
            if (border.getSelected() != -1) { //visible
                const size = border._getAdjustedSize();
                if (sumWidth > width && adjustableWidth > 0
                    && border.getLocation().getOrientation() == Orientation.HORZ
                    && size > 0) {
                    border._setAdjustedSize(size - 1);
                    sumWidth--;
                    adjustableWidth--;
                }
                else if (sumHeight > height && adjustableHeight > 0
                    && border.getLocation().getOrientation() == Orientation.VERT
                    && size > 0) {
                    border._setAdjustedSize(size - 1);
                    sumHeight--;
                    adjustableHeight--;
                }
            }
            i = (i + 1) % showingBorders.length;
        }

        for (var i = 0; i < showingBorders.length; i++) {
            var border = showingBorders[i];
            outerInnerRects = border._layout(outerInnerRects);
        }
        return outerInnerRects;
    }

    _findDropTargetNode(dragNode, x, y) {
        for (let i = 0; i < this._borders.length; i++) {
            const border = this._borders[i];
            if (border.isShowing()) {
                const dropInfo = border._canDrop(dragNode, x, y);
                if (dropInfo != null) {
                    return dropInfo;
                }
            }
        }
        return null;
    }
}

export default BorderSet;