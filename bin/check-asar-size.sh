#npm run package-electron
git_root=$(git rev-parse --show-toplevel)
cd "$git_root/out/TriliumNext Notes-linux-x64/resources"
out_dir=app.asar.extracted
rm -rf "$out_dir"
mkdir "$out_dir"
npx @electron/asar e app.asar "$out_dir"
ncdu "$out_dir"