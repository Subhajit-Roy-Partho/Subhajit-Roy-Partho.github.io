# Lumen Backend

- Add flipstudio [lumen-generator](https://github.com/flipboxstudio/lumen-generator) for obtaining all the Laravel functionality.
- `php artisan key:generate` to generate key for the application.
- `php artisan make:model Post -fmc` to generate Eloquont model Post.
- Edit database/migration/*create_posts_table.php
    - ADD
    ```
    $table->string(column:'title');
    $table->text(column:'body'); //These are the new column to be 
    //created during migration
    ```