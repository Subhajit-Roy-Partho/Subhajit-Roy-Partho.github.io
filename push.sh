npm install
bundle
JEKYLL_ENV=production bundle exec jekyll build
ssh sroy85@general.asu.edu 'rm -rf /afs/asu.edu/users/s/r/o/sroy85/www/*'
rsync -rzvP _site/* sroy85@general.asu.edu:/afs/asu.edu/users/s/r/o/sroy85/www