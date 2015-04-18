#!/bin/sh

cat Novation-Launchpad-S-scripts.js | sed 's/NovationLaunchpadS/NovationLaunchpad/g' | sed 's/Launchpad S/Launchpad/g' > Novation-Launchpad-scripts.js
