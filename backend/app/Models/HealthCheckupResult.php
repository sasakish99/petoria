<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class HealthCheckupResult extends Model
{
    protected $fillable = [
        'pet_id',
        'image_path',
        'clinic_name',
        'pet_name',
        'checkup_date',
        'results',
        'raw_text',
        'status',
    ];

    protected $casts = [
        'checkup_date' => 'date',
        'results' => 'array',
    ];

    public function pet()
    {
        return $this->belongsTo(Pet::class);
    }
}
