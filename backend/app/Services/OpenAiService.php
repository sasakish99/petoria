<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class OpenAiService
{
    protected string $apiKey;

    public function __construct()
    {
        $this->apiKey = config('services.openai.key');
    }
}
