/** DataScale */
class DataScale {
  /**
   *
   * @param {number} start
   * @param {number} end
   * @param {boolean} autoScaleStart
   * @param {boolean} autoScaleEnd
   * @param {number} containerHeight
   * @param {number} majorCharHeight
   * @param {boolean} zeroAlign
   * @param {function} formattingFunction
   * @constructor DataScale
   */
  constructor(
    start,
    end,
    autoScaleStart,
    autoScaleEnd,
    containerHeight,
    majorCharHeight,
    zeroAlign = false,
    formattingFunction = false,
  ) {
    this.majorSteps = [1, 2, 5, 10];
    this.minorSteps = [0.25, 0.5, 1, 2];
    this.customLines = null;

    this.containerHeight = containerHeight;
    this.majorCharHeight = majorCharHeight;
    this._start = start;
    this._end = end;

    this.scale = 1;
    this.minorStepIdx = -1;
    this.magnitudefactor = 1;
    this.determineScale();

    this.zeroAlign = zeroAlign;
    this.autoScaleStart = autoScaleStart;
    this.autoScaleEnd = autoScaleEnd;

    this.formattingFunction = formattingFunction;

    if (autoScaleStart || autoScaleEnd) {
      const me = this;
      const roundToMinor = (value) => {
        const rounded =
          value -
          (value % (me.magnitudefactor * me.minorSteps[me.minorStepIdx]));
        if (
          value % (me.magnitudefactor * me.minorSteps[me.minorStepIdx]) >
          0.5 * (me.magnitudefactor * me.minorSteps[me.minorStepIdx])
        ) {
          return rounded + me.magnitudefactor * me.minorSteps[me.minorStepIdx];
        } else {
          return rounded;
        }
      };
      if (autoScaleStart) {
        this._start -=
          this.magnitudefactor * 2 * this.minorSteps[this.minorStepIdx];
        this._start = roundToMinor(this._start);
      }

      if (autoScaleEnd) {
        this._end += this.magnitudefactor * this.minorSteps[this.minorStepIdx];
        this._end = roundToMinor(this._end);
      }
      this.determineScale();
    }
  }

  /**
   * set chart height
   * @param {number} majorCharHeight
   */
  setCharHeight(majorCharHeight) {
    this.majorCharHeight = majorCharHeight;
  }

  /**
   * set height
   * @param {number} containerHeight
   */
  setHeight(containerHeight) {
    this.containerHeight = containerHeight;
  }

  /**
   * determine scale
   */
  determineScale() {
    const range = this._end - this._start;
    this.scale = this.containerHeight / range;
    const minimumStepValue = this.majorCharHeight / this.scale;
    const orderOfMagnitude =
      range > 0 ? Math.round(Math.log(range) / Math.LN10) : 0;

    this.minorStepIdx = -1;
    this.magnitudefactor = Math.pow(10, orderOfMagnitude);

    let start = 0;
    if (orderOfMagnitude < 0) {
      start = orderOfMagnitude;
    }

    let solutionFound = false;
    for (let l = start; Math.abs(l) <= Math.abs(orderOfMagnitude); l++) {
      this.magnitudefactor = Math.pow(10, l);
      for (let j = 0; j < this.minorSteps.length; j++) {
        const stepSize = this.magnitudefactor * this.minorSteps[j];
        if (stepSize >= minimumStepValue) {
          solutionFound = true;
          this.minorStepIdx = j;
          break;
        }
      }
      if (solutionFound === true) {
        break;
      }
    }
  }

  /**
   * returns if value is major
   * @param {number} value
   * @returns {boolean}
   */
  is_major(value) {
    return (
      value % (this.magnitudefactor * this.majorSteps[this.minorStepIdx]) === 0
    );
  }

  /**
   * returns step size
   * @returns {number}
   */
  getStep() {
    return this.magnitudefactor * this.minorSteps[this.minorStepIdx];
  }

  /**
   * returns first major
   * @returns {number}
   */
  getFirstMajor() {
    const majorStep = this.magnitudefactor * this.majorSteps[this.minorStepIdx];
    return this.convertValue(
      this._start + ((majorStep - (this._start % majorStep)) % majorStep),
    );
  }

  /**
   * returns first major
   * @param {date} current
   * @returns {date} formatted date
   */
  formatValue(current) {
    let returnValue = current.toPrecision(5);
    if (typeof this.formattingFunction === "function") {
      returnValue = this.formattingFunction(current);
    }

    if (typeof returnValue === "number") {
      return `${returnValue}`;
    } else if (typeof returnValue === "string") {
      return returnValue;
    } else {
      return current.toPrecision(5);
    }
  }

  /**
   * returns lines
   * @returns {object} lines
   */
  getLines() {
    const lines = [];
    const step = this.getStep();
    const bottomOffset = (step - (this._start % step)) % step;
    for (
      let i = this._start + bottomOffset;
      this._end - i > 0.00001;
      i += step
    ) {
      if (i != this._start) {
        //Skip the bottom line
        lines.push({
          major: this.is_major(i),
          y: this.convertValue(i),
          val: this.formatValue(i),
        });
      }
    }
    return lines;
  }

  /**
   * follow scale
   * @param {object} other
   */
  followScale(other) {
    const oldStepIdx = this.minorStepIdx;
    const oldStart = this._start;
    const oldEnd = this._end;

    const me = this;
    const increaseMagnitude = () => {
      me.magnitudefactor *= 2;
    };
    const decreaseMagnitude = () => {
      me.magnitudefactor /= 2;
    };

    if (
      (other.minorStepIdx <= 1 && this.minorStepIdx <= 1) ||
      (other.minorStepIdx > 1 && this.minorStepIdx > 1)
    ) {
      //easy, no need to change stepIdx nor multiplication factor
    } else if (other.minorStepIdx < this.minorStepIdx) {
      //I'm 5, they are 4 per major.
      this.minorStepIdx = 1;
      if (oldStepIdx == 2) {
        increaseMagnitude();
      } else {
        increaseMagnitude();
        increaseMagnitude();
      }
    } else {
      //I'm 4, they are 5 per major
      this.minorStepIdx = 2;
      if (oldStepIdx == 1) {
        decreaseMagnitude();
      } else {
        decreaseMagnitude();
        decreaseMagnitude();
      }
    }

    //Get masters stats:
    const otherZero = other.convertValue(0);
    const otherStep = other.getStep() * other.scale;

    let done = false;
    let count = 0;
    //Loop until magnitude is correct for given constrains.
    while (!done && count++ < 5) {
      //Get my stats:
      this.scale =
        otherStep / (this.minorSteps[this.minorStepIdx] * this.magnitudefactor);
      const newRange = this.containerHeight / this.scale;

      //For the case the magnitudefactor has changed:
      this._start = oldStart;
      this._end = this._start + newRange;

      const myOriginalZero = this._end * this.scale;
      const majorStep =
        this.magnitudefactor * this.majorSteps[this.minorStepIdx];
      const majorOffset = this.getFirstMajor() - other.getFirstMajor();

      if (this.zeroAlign) {
        const zeroOffset = otherZero - myOriginalZero;
        this._end += zeroOffset / this.scale;
        this._start = this._end - newRange;
      } else {
        if (!this.autoScaleStart) {
          this._start += majorStep - majorOffset / this.scale;
          this._end = this._start + newRange;
        } else {
          this._start -= majorOffset / this.scale;
          this._end = this._start + newRange;
        }
      }
      if (!this.autoScaleEnd && this._end > oldEnd + 0.00001) {
        //Need to decrease magnitude to prevent scale overshoot! (end)
        decreaseMagnitude();
        done = false;
        continue;
      }
      if (!this.autoScaleStart && this._start < oldStart - 0.00001) {
        if (this.zeroAlign && oldStart >= 0) {
          console.warn("Can't adhere to given 'min' range, due to zeroalign");
        } else {
          //Need to decrease magnitude to prevent scale overshoot! (start)
          decreaseMagnitude();
          done = false;
          continue;
        }
      }
      if (
        this.autoScaleStart &&
        this.autoScaleEnd &&
        newRange < oldEnd - oldStart
      ) {
        increaseMagnitude();
        done = false;
        continue;
      }
      done = true;
    }
  }

  /**
   * convert value
   * @param {number} value
   * @returns {number}
   */
  convertValue(value) {
    return this.containerHeight - (value - this._start) * this.scale;
  }

  /**
   * returns screen to value
   * @param {number} pixels
   * @returns {number}
   */
  screenToValue(pixels) {
    return (this.containerHeight - pixels) / this.scale + this._start;
  }
}

export default DataScale;
