'use babel';

const { TextEditor, CompositeDisposable, Disposable, BufferedProcess, Directory } = require('atom')

module.exports =

class Dialog {

  constructor(inputPath, prompt) {
    this.subscriptions = new CompositeDisposable()

    this.element = document.createElement('div')
    this.element.classList.add('justnotes-dialog')

    this.promptText = document.createElement('label')
    this.promptText.classList.add('icon')
    this.promptText.classList.add('icon-file-add')
    this.promptText.textContent = prompt
    this.element.appendChild(this.promptText)

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

    this.errorMessage = document.createElement('div')
    this.errorMessage.classList.add('error-message')
    this.element.appendChild(this.errorMessage)
    this.subscriptions.add(this.miniEditor.onDidChange(() => this.showError()))

    this.subscriptions.add(
        atom.commands.add(this.element, {
        'core:confirm': () => this.onConfirm(inputPath,
          this.miniEditor.getText()),
        'core:cancel': () => this.cancel()
      })
    )
  }

  onConfirm(inputPath, outputPath) {
    const outputDir = new Directory(outputPath)
    const exists = outputDir.existsSync()
    if (exists) {
      this.showError(`${outputPath} already exists.`)
      return
    }

    const packagePath = atom.packages.loadedPackages['justnotes'].path
    const scriptsPath = `${packagePath}/script`
    const command = `.${scriptsPath}/justnotes.py`
    const args = [
      '--css', `${scriptsPath}/justnotes.css`,
      inputPath, outputPath
    ]
    const stdout = (output) => console.log('justnotes: ', output)
    const exit = (code) => console.log(`justnotes: justnotes.py exited with code ${code}`)
    const process = new BufferedProcess({command, args, stdout, exit})

    this.close()
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

  showError(message='') {
    this.errorMessage.textContent = message
  }

}
