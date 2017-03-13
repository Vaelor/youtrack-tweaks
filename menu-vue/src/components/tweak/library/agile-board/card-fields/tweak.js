import Vue from 'vue'
import Component from 'vue-class-component'

import TweakEditMixin from '../../../tweak-edit-mixin'

export const type = 'agile-board/card-fields'

export const name = 'Agile Board Card Fields'

export const schema = {
  boardName: String,
  sprintName: String,
  sizeParams0: String,
  sizeParams1: String,
  sizeParams2: String,
  sizeParams3: String
}

@Component({
  props: {
    tweak: Object
  },
  template: require('./view.html')
})
export class View extends Vue {
}

@Component()
export class Edit extends TweakEditMixin {
}
