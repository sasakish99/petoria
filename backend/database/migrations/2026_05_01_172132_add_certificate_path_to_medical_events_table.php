<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('medical_events', function (Blueprint $table) {
            $table->string('certificate_path')->nullable()->after('is_completed');
            $table->date('next_event_date')->nullable()->after('event_date');
            $table->string('vaccine_type')->nullable()->after('title'); // mixed, rabies, etc.
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('medical_events', function (Blueprint $table) {
            $table->dropColumn(['certificate_path', 'next_event_date', 'vaccine_type']);
        });
    }
};
