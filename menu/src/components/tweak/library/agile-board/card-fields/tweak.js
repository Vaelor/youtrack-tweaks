import Component from 'vue-class-component'

import TweakEditMixin from '../../../mixins/tweak-edit-mixin.vue'
import TweakViewMixin from '../../../mixins/tweak-view-mixin.vue'

import SortedListEdit from '@/components/editor/sorted-list/edit.vue'
import SortedListView from '@/components/editor/sorted-list/view.vue'

import ToggleEdit from '@/components/editor/toggle/edit.vue'

import Toolbar from './toolbar.vue'
import ItemView from './view.vue'

import genericScheme from '../generic/schema'

import * as i18n from './i18n'

export const type = 'agile-board/card-fields'

export const name = 'Agile board card'

const fieldsEditor = {
  simple: true,
  edit: SortedListEdit,
  view: SortedListView,
  depends: config => !config.singleMode,
  default: [],
  options: {
    toolbar: Toolbar,
    view: ItemView,
    item: {
      name: '',
      conversion: 'no',
      color: {
        mode: 'inherit',
        opacity: 1,
        generator: 32
      }
    },
    check: item => item.name.trim() !== '',
    sortable: true
  }
}

const toggleEditor = {
  edit: ToggleEdit,
  default: true,
  options: {}
}

export const schema = {
  ...genericScheme(name),
  prependIssueId: {
    simple: true,
    ...toggleEditor,
    default: true
  },
  disableFixedHeight: {
    simple: true,
    ...toggleEditor,
    default: true
  },
  showTagsInSmallModes: {
    ...toggleEditor,
    default: false
  },
  extendCardColorArea: {
    ...toggleEditor,
    default: false
  },
  singleMode: toggleEditor,
  sizeParams0: fieldsEditor,
  sizeParams1: fieldsEditor,
  sizeParams2: fieldsEditor,
  sizeParams3: fieldsEditor,
  sizeParams: {
    ...fieldsEditor,
    depends: config => config.singleMode
  }
}

@Component
export class View extends TweakViewMixin {
  i18n = i18n
}

@Component
export class Edit extends TweakEditMixin {
  i18n = i18n
}
