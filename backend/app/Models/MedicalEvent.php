<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MedicalEvent extends Model
{
    protected $fillable = [
        'pet_id',
        'title',
        'event_date',
        'is_completed',
    ];

    protected $casts = [
        'event_date' => 'date',
        'is_completed' => 'boolean',
    ];

    public function pet()
    {
        return $this->belongsTo(Pet::class);
    }
}
