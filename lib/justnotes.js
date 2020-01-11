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
    // TODO how to display error or make call impossible in the first place?
    // treeView rename on empty selection just does nothing
    if (selectedPaths.length === 0 || selectedPaths.length > 1) {
      console.log(`justnotes: selected multiple paths or empty: [${selectedPaths}]`)
      return
    }

    const dialog = new Dialog(selectedPaths[0], 'Enter the output path for the conversion.')
    dialog.attach()
  }

};
