import Vue from 'vue'
import Component from 'vue-class-component'
import EditorMixin from '../editor-mixin/editor-mixin'

import draggable from 'vuedraggable'

@Component({
  components: {
    draggable
  },
  props: {
    value: Array
  }
})export default class extends EditorMixin {
  list = []

  newItem = {...(this.options.item || {})}

  beforeMount () {
    this.list = this.value.slice()
  }

  clear () {
    this.newItem = {...(this.options.item || {})}
  }

  add () {
    if (this.options.check && this.options.check(this.newItem)) {
      this.list.push(this.newItem)
      this.clear()
      this.$emit('input', this.list)
    } else {
      throw new Error('options.check should be a Function')
    }
  }

  remove (index) {
    this.list.splice(index, 1)
    this.$emit('input', this.list)
  }

  dragEnd () {
    this.$emit('input', this.list)
  }
}
