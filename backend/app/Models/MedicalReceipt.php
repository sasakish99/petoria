<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MedicalReceipt extends Model
{
    protected $fillable = [
        'pet_id',
        'image_path',
        'clinic_name',
        'receipt_date',
        'total_amount',
        'items',
        'raw_text',
        'pet_name',
        'status',
    ];

    protected $casts = [
        'receipt_date' => 'date',
        'total_amount' => 'decimal:2',
        'items' => 'array',
    ];

    public function pet()
    {
        return $this->belongsTo(Pet::class);
    }
}
