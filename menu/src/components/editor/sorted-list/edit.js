import Vue from 'vue'
import Component from 'vue-class-component'
import EditorMixin from '../editor-mixin/edit-mixin'

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
  editIndex = null

  get editMode () {
    return this.editIndex !== null
  }

  beforeMount () {
    this.list = this.value.slice()
  }

  clear () {
    this.newItem = {...(this.options.item || {})}
    this.editIndex = null
  }

  update () {
    if (this.options.check && this.options.check(this.newItem)) {
      if (this.editMode) {
        this.list[this.editIndex] = { ...this.newItem }
      } else {
        this.list.push(this.newItem)
      }
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

  edit (index) {
    this.editIndex = index
    this.newItem = { ...this.list[index] }
  }

  dragEnd () {
    this.$emit('input', this.list)
  }
}
