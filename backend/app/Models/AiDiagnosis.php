<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AiDiagnosis extends Model
{
    protected $fillable = [
        'pet_id',
        'image_path',
        'result_text',
        'status',
    ];

    public function pet()
    {
        return $this->belongsTo(Pet::class);
    }
}
