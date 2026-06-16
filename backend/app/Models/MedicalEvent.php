<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MedicalEvent extends Model
{
    protected $fillable = [
        'pet_id',
        'title',
        'vaccine_type',
        'clinic_name',
        'event_date',
        'next_event_date',
        'is_completed',
        'certificate_path',
        'notes',
    ];

    protected $casts = [
        'event_date' => 'date',
        'next_event_date' => 'date',
        'is_completed' => 'boolean',
    ];

    public function pet()
    {
        return $this->belongsTo(Pet::class);
    }
}
