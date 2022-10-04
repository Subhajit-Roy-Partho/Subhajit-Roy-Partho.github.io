# Lumen Backend

- Add flipstudio [lumen-generator](https://github.com/flipboxstudio/lumen-generator) for obtaining all the Laravel functionality.
- `php artisan key:generate` to generate key for the application.
- `php artisan make:model Post -fmc` to generate Eloquont model Post.
- Edit database/migration/*create_posts_table.php
    - ADD
    ```php
    $table->string(column:'title');
    $table->text(column:'body'); //These are the new column to be 
    //created during migration
    ```
- Edit databae/factories/PostFactory.php
    - ADD
        ```php
        return [
    	    'title'=>$this->faker->sentence,
            'body'=>$this->faker->paragraph
    	];
        ```
- Edit Models/Post.php
    - ADD
    ```php
    use HasFactory;
    ```
- `php artisan tinker`
    - `App\Models\Post::factory()->count(10)->create()` # Ranndomly generate 10 dummy post
- Edit routes\web.php
    - ADD
    ```php
    $router->group(['prefix'=>'api'],function() use ($router){
        $router->get('/posts', 'PostController@index');
    });
    ```
- Edit App/http/Controllers/PostController.php
    - ADD
    ```php
    
    ```