'use babel';

const { CompositeDisposable, Disposable, BufferedProcess } = require('atom');
import Dialog from './dialog'

module.exports = {

  subscriptions: null,

  activate() {
    this.subscriptions = new CompositeDisposable();
    this.subscriptions.add(atom.commands.add('.tree-view', {
      'justnotes:to-html': () => this.tohtml(this.treeView.selectedPaths())
    }));
  },

  consumeTreeView(treeView) {
    this.treeView = treeView
    return new Disposable(() => {
      this.treeView = null
    })
  },

  deactivate() {
    this.subscriptions.dispose();
  },

  tohtml(selectedPaths) {
    if (selectedPaths.length > 1) {
      console.log(`Unable to convert multiple selected paths to html: [${selectedPaths}]`)
      return
    }

    const dialog = new Dialog(selectedPaths[0], prompt)
    dialog.attach()
  }

};
