#!/bin/sh

LIBRARY_PATH=/Applications/Mixxx.app/Contents/Resources/controllers
USERLIB_PATH=~/Library/Application\ Support/Mixxx/controllers

if [ -e /Applications/Mixxx.app/Contents/Resources/controllers/Novation-Launchpad-scripts.js ]; then
    cp Novation-Launchpad-scripts.js ${LIBRARY_PATH}/Novation-Launchpad-scripts.js
fi

cp "Novation Launchpad S.midi.xml" ${LIBRARY_PATH}/
cp Novation-Launchpad-S-scripts.js ${LIBRARY_PATH}/
