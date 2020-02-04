#!/usr/bin/env python3

# Deep-converts each .md file in a given directory to .html with pandoc.
# Preserves links between .md files, css file references etc. Creates an index file per
# default.
#
# Run `./justnotes.py --help` to display usage information.

def main():
    import logging
    import argparse
    import datetime
    import sys
    import shutil
    import os
    import subprocess
    import re

    parser = argparse.ArgumentParser(description='Create a copy of a directory tree where all .md files are replaced with .html files. I.e. create a website from your collection of .md notes.')
    parser.add_argument("--verbose", help="activate verbose output", action="store_true")
    parser.add_argument("--logfile", help="log file path - if none given, log is written to stdout")
    # program parameters
    parser.add_argument("src", metavar="SRC", help="source directory tree containing .md files")
    parser.add_argument("dst", metavar="DST", help="destination for directory tree where .md have been replaced with .html files")
    parser.add_argument("--css", help="css file")
    parser.add_argument("--index", default=True, type=bool, help="create index.html file")
    args = parser.parse_args()

    loglevel = logging.WARNING
    if args.verbose:
        loglevel = logging.DEBUG
    if args.logfile:
        logging.basicConfig(filename=args.logfile, level=loglevel)
    else:
        logging.basicConfig(level=loglevel)
    logging.info('--{} started-- {}'.format(sys.argv[0], datetime.datetime.now()))
    logging.info('Arguments{{{}}}'.format(args))

    inputDir = os.path.normpath(args.src)
    outputDir = os.path.normpath(args.dst)

    # currently only directories are supported
    if not os.path.isdir(inputDir) or os.path.islink(inputDir):
        raise RuntimeError('Only directories supported as input')
    if os.path.exists(outputDir):
        raise RuntimeError('Destination already exists')

    # add all .md files in the subtree of the given dir to the result list
    def deep_ls(dir, resultlist):
        for entry in os.scandir(dir):
            if entry.name.endswith('.md'):
                resultlist += [entry]
            elif entry.is_dir():
                deep_ls(entry.path, resultlist)

    # deep copy notes root folder
    shutil.copytree(inputDir, outputDir)

    # add index.md file - this has to happen early for it to make it onto the .md files list
    indexpath = outputDir + "/index.md"
    if args.index:
        f = open(indexpath, 'w', encoding='utf-8')
        f.close()

    mdfiles = []
    deep_ls(outputDir, mdfiles)

    # write index file
    if args.index:
        with open(indexpath, 'w', encoding='utf-8') as idxfile:
            idxfile.write('---\ntitle: Index\n---\n\n')

            def relative_to_output(path):
                return path.replace(outputDir + '/', '')

            def write_index(dir, level=0):
                files = filter(lambda entry: entry.name.endswith('.md') and entry.is_file(), os.scandir(dir))
                dirs = filter(lambda entry: entry.is_dir(), os.scandir(dir))
                for mdentry in sorted(files, key=lambda entry: entry.name.lower()):
                    if mdentry.path == indexpath:
                        continue
                    idxfile.write('\t' * level + '- [{}]({})\n'.format(mdentry.name, relative_to_output(mdentry.path)))
                for mddir in sorted(dirs, key=lambda entry: entry.name.lower()):
                    idxfile.write('\t' * level + '- [{}]({})\n'.format(mddir.name, relative_to_output(mddir.path)))
                    write_index(mddir.path, level + 1)
            write_index(outputDir)

    # copy css file to output dir
    cssfile = args.css
    if cssfile:
        cssfile = os.path.normpath(cssfile)
        cssfilebase = os.path.basename(cssfile)
        shutil.copy(cssfile, outputDir + '/')

    # convert .md files to .html
    for mdentry in mdfiles:
        htmlfile = mdentry.path.replace('.md', '.html')

        if cssfile:
            # relative path from html file to css file in output root
            csspath = os.path.relpath(outputDir + "/" + cssfilebase, start=os.path.dirname(htmlfile))
            subprocess.run(['pandoc', '--standalone', mdentry.path, '--css', csspath, '--highlight-style=kate', '-o', htmlfile])
        else:
            subprocess.run(['pandoc', '--standalone', mdentry.path, '--highlight-style=kate', '-o', htmlfile])
        # delete .md files of copy
        os.remove(mdentry)
        # change links within files to point from .md files to .html files
        #    - find all      <a href="note1.md">
        #      replace with  <ahref="note1.html">
        tmpfile = htmlfile + ".tmp"
        mdmatcher = re.compile(".md\">")
        with open(htmlfile, "r", encoding="utf-8") as fi:
            with open(tmpfile, "w", encoding="utf-8") as fo:
                for line in fi:
                    fo.write(re.subn(mdmatcher, ".html\">", line)[0])
        os.replace(tmpfile, htmlfile)

if __name__ == "__main__":
    main()
