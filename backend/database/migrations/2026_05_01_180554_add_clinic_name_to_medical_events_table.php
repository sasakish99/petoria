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
            $table->string('clinic_name')->nullable()->after('vaccine_type');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('medical_events', function (Blueprint $table) {
            $table->dropColumn('clinic_name');
        });
    }
};
