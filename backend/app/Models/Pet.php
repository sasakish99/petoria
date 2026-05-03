<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Pet extends Model
{
    protected $fillable = [
        'user_id',
        'name',
        'species',
        'gender',
        'breed_id',
        'image_path',
        'birthday',
        'target_weight',
        'theme_color',
    ];

    protected $casts = [
        'birthday' => 'date',
        'target_weight' => 'decimal:2',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function breed()
    {
        return $this->belongsTo(Breed::class);
    }

    public function weightLogs()
    {
        return $this->hasMany(WeightLog::class);
    }

    public function healthLogs()
    {
        return $this->hasMany(HealthLog::class);
    }

    public function exerciseLogs()
    {
        return $this->hasMany(ExerciseLog::class);
    }

    public function medicalEvents()
    {
        return $this->hasMany(MedicalEvent::class);
    }

    public function aiDiagnoses()
    {
        return $this->hasMany(AiDiagnosis::class);
    }
}
