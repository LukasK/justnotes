'use babel';

const { TextEditor, CompositeDisposable, Disposable } = require('atom')

module.exports =

class Dialog {

  constructor(inputPath, prompt) {
    // TODO emitter?
    this.subscriptions = new CompositeDisposable()

    this.element = document.createElement('div')
    this.element.classList.add('justnotes-dialog')

    this.miniEditor = new TextEditor({mini: true})
    const blurHandler = () => {
      if (document.hasFocus()) {
        this.close()
      }
    }
    this.miniEditor.element.addEventListener('blur', blurHandler)
    this.subscriptions.add(new Disposable(() => {
      this.miniEditor.element.removeEventListener('blur', blurHandler)
    }))
    this.element.appendChild(this.miniEditor.element)
    this.miniEditor.setText(inputPath)

    this.subscriptions.add(
        atom.commands.add(this.element, {
        'core:confirm': () => this.onConfirm(inputPath,
          this.miniEditor.getText()),
        'core:cancel': () => this.cancel()
      })
    )
  }

  onConfirm(inputPath, outputPath) {
    console.log(`confirmed: inputPath=${inputPath}, outputPath=${outputPath}`)
    this.close()

    // const packagePath = atom.packages.loadedPackages['justnotes'].path
    // const scriptsPath = `${packagePath}/script`
    // const command = `.${scriptsPath}/justnotes.py`
    // const args = [
    //   '--css', `${scriptsPath}/justnotes.css`,
    //   selectedPath, outputPath
    // ]
    // const stdout = (output) => console.log(output)
    // const exit = (code) => console.log(`justnotes.py exited with code ${code}`)
    // const process = new BufferedProcess({command, args, stdout, exit})
  }

  attach() {
    this.panel = atom.workspace.addModalPanel({item: this})
    this.miniEditor.element.focus()
    this.miniEditor.scrollToCursorPosition()
  }

  close() {
    const panel = this.panel
    this.panel = null
    if (panel) {
      panel.destroy()
    }
    this.subscriptions.dispose()
    this.miniEditor.destroy()
    const activePane = atom.workspace.getCenter().getActivePane()
    if (!activePane.isDestroyed()) {
      activePane.activate()
    }
  }

  cancel() {
    this.close()
    const treeViewElement = document.querySelector('.tree-view')
    if (treeViewElement) {
      treeViewElement.focus()
    }
  }

  showError(message) {
    // TODO
  }

}
