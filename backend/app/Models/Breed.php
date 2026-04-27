<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Breed extends Model
{
    protected $fillable = ['name', 'species'];

    public function pets()
    {
        return $this->hasMany(Pet::class);
    }
}
