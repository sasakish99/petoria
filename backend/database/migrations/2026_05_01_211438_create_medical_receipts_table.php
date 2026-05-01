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
        Schema::create('medical_receipts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('pet_id')->constrained()->onDelete('cascade');
            $table->string('image_path');
            $table->string('clinic_name')->nullable();
            $table->date('receipt_date')->nullable();
            $table->decimal('total_amount', 10, 2)->nullable();
            $table->json('items')->nullable(); // 明細項目をJSONで保持
            $table->text('raw_text')->nullable(); // AI解析の生テキスト
            $table->string('status')->default('pending'); // pending, completed, failed
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('medical_receipts');
    }
};
