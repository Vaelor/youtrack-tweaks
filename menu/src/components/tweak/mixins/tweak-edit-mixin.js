import TweakMixin from './tweak-mixin'
import Component from 'vue-class-component'

@Component()
export default class extends TweakMixin {
  isShown (fieldKey) {
    return this.info[fieldKey].simple || this.expertView && !this.info[fieldKey].simple
  }
}
