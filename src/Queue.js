const _ = require('lodash');
const { EventEmitter } = require('events');

class Queue extends EventEmitter {
  constructor(maxCount = 64) {
    super();
    this.maxCount = maxCount;
    this.count = 0;
    this.queue = [];
  }

  in(promise, ...args) {
    if (this.count <= this.maxCount) {
      this.count++;
      promise(...args)
        .then(
          (ret) => {
            this.count--;
            this.emit('success', ret, ...args);
          },
          (error) => {
            this.count--;
            this.emit('fail', error, ...args);
          },
        )
        .finally(() => {
          if (_.isEmpty(this.queue) && this.count === 0) {
            this.emit('empty');
            return;
          }
          if (this.isFull()) {
            return;
          }
          if (_.isEmpty(this.queue)) {
            return;
          }
          let item = this.queue.shift();
          while (item) {
            const [q, ...rest] = item;
            if (this.in(q, ...rest)) {
              item = this.queue.shift();
            } else {
              item = null;
            }
          }
        });
      return !this.isFull();
    }
    this.queue.push([promise, ...args]);
    return false;
  }

  isFull() {
    return this.count >= this.maxCount;
  }
}

module.exports = Queue;
