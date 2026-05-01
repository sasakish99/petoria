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
        Schema::create('health_checkup_results', function (Blueprint $table) {
            $table->id();
            $table->foreignId('pet_id')->constrained()->onDelete('cascade');
            $table->string('image_path');
            $table->string('clinic_name')->nullable();
            $table->string('pet_name')->nullable();
            $table->date('checkup_date')->nullable();
            $table->json('results')->nullable(); // 検査項目と数値をJSONで保持
            $table->text('raw_text')->nullable(); // AI解析の生テキスト
            $table->string('status')->default('pending');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('health_checkup_results');
    }
};
