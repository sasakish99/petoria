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
        Schema::table('health_logs', function (Blueprint $table) {
            $table->dropColumn(['meal_amount', 'stool_status', 'urine_status']);
            $table->integer('condition')->default(3)->comment('1:最悪, 2:悪い, 3:普通, 4:良い, 5:最高')->after('pet_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('health_logs', function (Blueprint $table) {
            $table->dropColumn('condition');
            $table->integer('meal_amount')->nullable();
            $table->string('stool_status')->nullable();
            $table->string('urine_status')->nullable();
        });
    }
};
