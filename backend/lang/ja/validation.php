<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Validation Language Lines
    |--------------------------------------------------------------------------
    |
    | The following language lines contain the default error messages used by
    | the validator class. Some of these rules have multiple versions such
    | as the size rules. Feel free to tweak each of these messages here.
    |
    */

    'accepted' => ':attributeを承認してください。',
    'accepted_if' => ':otherが:valueの場合、:attributeを承認してください。',
    'active_url' => ':attributeは有効なURLではありません。',
    'after' => ':attributeには:dateより後の日付を指定してください。',
    'after_or_equal' => ':attributeには:date以降の日付を指定してください。',
    'alpha' => ':attributeには英字のみを使用してください。',
    'alpha_dash' => ':attributeには英数字、ハイフン、アンダースコアのみを使用してください。',
    'alpha_num' => ':attributeには英数字のみを使用してください。',
    'array' => ':attributeは配列でなければなりません。',
    'ascii' => ':attributeには半角英数字と記号のみを使用してください。',
    'before' => ':attributeには:dateより前の日付を指定してください。',
    'before_or_equal' => ':attributeには:date以前の日付を指定してください。',
    'between' => [
        'array' => ':attributeの項目数は:min個から:max個の間でなければなりません。',
        'file' => ':attributeのサイズは:min KBから:max KBの間でなければなりません。',
        'numeric' => ':attributeは:minから:maxの間でなければなりません。',
        'string' => ':attributeは:min文字から:max文字の間でなければなりません。',
    ],
    'boolean' => ':attributeには真偽値を指定してください。',
    'can' => ':attributeに権限のない値が含まれています。',
    'confirmed' => ':attributeの確認が一致しません。',
    'contains' => ':attributeに必須項目が含まれていません。',
    'current_password' => 'パスワードが正しくありません。',
    'date' => ':attributeは有効な日付ではありません。',
    'date_equals' => ':attributeには:dateと同じ日付を指定してください。',
    'date_format' => ':attributeの形式は:formatと一致しません。',
    'decimal' => ':attributeは小数点以下:decimal桁でなければなりません。',
    'declined' => ':attributeを拒否してください。',
    'declined_if' => ':otherが:valueの場合、:attributeを拒否してください。',
    'different' => ':attributeと:otherには異なる値を指定してください。',
    'digits' => ':attributeは:digits桁でなければなりません。',
    'digits_between' => ':attributeは:min桁から:max桁の間でなければなりません。',
    'dimensions' => ':attributeの画像サイズが無効です。',
    'distinct' => ':attributeに重複した値があります。',
    'doesnt_end_with' => ':attributeの終わりは以下のいずれかであってはなりません: :values',
    'doesnt_start_with' => ':attributeの始まりは以下のいずれかであってはなりません: :values',
    'email' => ':attributeは有効なメールアドレスでなければなりません。',
    'ends_with' => ':attributeの終わりは以下のいずれかの値でなければなりません: :values',
    'enum' => '選択された:attributeは無効です。',
    'exists' => '選択された:attributeは無効です。',
    'extensions' => ':attributeの拡張子は以下のいずれかでなければなりません: :values',
    'file' => ':attributeはファイルでなければなりません。',
    'filled' => ':attributeに値を入力してください。',
    'gt' => [
        'array' => ':attributeの項目数は:value個より多くなければなりません。',
        'file' => ':attributeのサイズは:value KBより大きくなければなりません。',
        'numeric' => ':attributeは:valueより大きくなければなりません。',
        'string' => ':attributeは:value文字より長くなければなりません。',
    ],
    'gte' => [
        'array' => ':attributeの項目数は:value個以上でなければなりません。',
        'file' => ':attributeのサイズは:value KB以上でなければなりません。',
        'numeric' => ':attributeは:value以上でなければなりません。',
        'string' => ':attributeは:value文字以上でなければなりません。',
    ],
    'hex_color' => ':attributeは有効な16進数の色でなければなりません。',
    'image' => ':attributeは画像でなければなりません。',
    'in' => '選択された:attributeは無効です。',
    'in_array' => ':attributeは:otherに存在しません。',
    'integer' => ':attributeは整数でなければなりません。',
    'ip' => ':attributeは有効なIPアドレスでなければなりません。',
    'ipv4' => ':attributeは有効なIPv4アドレスでなければなりません。',
    'ipv6' => ':attributeは有効なIPv6アドレスでなければなりません。',
    'json' => ':attributeは有効なJSON文字列でなければなりません。',
    'list' => ':attributeはリストでなければなりません。',
    'lowercase' => ':attributeには小文字のみを使用してください。',
    'lt' => [
        'array' => ':attributeの項目数は:value個より少なくなければなりません。',
        'file' => ':attributeのサイズは:value KBより小さくなければなりません。',
        'numeric' => ':attributeは:valueより小さくなければなりません。',
        'string' => ':attributeは:value文字より短くなければなりません。',
    ],
    'lte' => [
        'array' => ':attributeの項目数は:value個以下でなければなりません。',
        'file' => ':attributeのサイズは:value KB以下でなければなりません。',
        'numeric' => ':attributeは:value以下でなければなりません。',
        'string' => ':attributeは:value文字以下でなければなりません。',
    ],
    'mac_address' => ':attributeは有効なMACアドレスでなければなりません。',
    'max' => [
        'array' => ':attributeの項目数は:max個以下でなければなりません。',
        'file' => ':attributeのサイズは:max KB以下でなければなりません。',
        'numeric' => ':attributeは:max以下でなければなりません。',
        'string' => ':attributeは:max文字以下でなければなりません。',
    ],
    'max_digits' => ':attributeは:max桁以下でなければなりません。',
    'mimes' => ':attributeのファイル形式は以下のいずれかでなければなりません: :values',
    'mimetypes' => ':attributeのファイル形式は以下のいずれかでなければなりません: :values',
    'min' => [
        'array' => ':attributeの項目数は:min個以上でなければなりません。',
        'file' => ':attributeのサイズは:min KB以上でなければなりません。',
        'numeric' => ':attributeは:min以上でなければなりません。',
        'string' => ':attributeは:min文字以上でなければなりません。',
    ],
    'min_digits' => ':attributeは:min桁以上でなければなりません。',
    'missing' => ':attributeを入力しないでください。',
    'missing_if' => ':otherが:valueの場合、:attributeを入力しないでください。',
    'missing_unless' => ':otherが:valueでない場合、:attributeを入力しないでください。',
    'missing_with' => ':valuesが含まれている場合、:attributeを入力しないでください。',
    'missing_with_all' => ':valuesが含まれている場合、:attributeを入力しないでください。',
    'multiple_of' => ':attributeは:valueの倍数でなければなりません。',
    'not_in' => '選択された:attributeは無効です。',
    'not_regex' => ':attributeの形式が無効です。',
    'numeric' => ':attributeは数値でなければなりません。',
    'password' => [
        'letters' => ':attributeには少なくとも1つの文字が含まれている必要があります。',
        'mixed' => ':attributeには少なくとも1つの大文字と小文字が含まれている必要があります。',
        'numbers' => ':attributeには少なくとも1つの数字が含まれている必要があります。',
        'symbols' => ':attributeには少なくとも1つの記号が含まれている必要があります。',
        'uncompromised' => '指定された:attributeは情報漏洩により流出した可能性があります。別の:attributeを選択してください。',
    ],
    'present' => ':attributeが存在しなければなりません。',
    'present_if' => ':otherが:valueの場合、:attributeが存在しなければなりません。',
    'present_unless' => ':otherが:valueでない場合、:attributeが存在しなければなりません。',
    'present_with' => ':valuesが存在する場合、:attributeが存在しなければなりません。',
    'present_with_all' => ':valuesが存在する場合、:attributeが存在しなければなりません。',
    'prohibited' => ':attributeの入力は禁止されています。',
    'prohibited_if' => ':otherが:valueの場合、:attributeの入力は禁止されています。',
    'prohibited_unless' => ':otherが:valueでない限り、:attributeの入力は禁止されています。',
    'prohibits' => ':attributeを入力する場合、:otherを入力することはできません。',
    'regex' => ':attributeの形式が無効です。',
    'required' => ':attributeは必須です。',
    'required_if' => ':otherが:valueの場合、:attributeは必須です。',
    'required_if_accepted' => ':otherを承認した場合、:attributeは必須です。',
    'required_if_declined' => ':otherを拒否した場合、:attributeは必須です。',
    'required_unless' => ':otherが:valueでない限り、:attributeは必須です。',
    'required_with' => ':valuesが入力されている場合、:attributeは必須です。',
    'required_with_all' => ':valuesが全て入力されている場合、:attributeは必須です。',
    'required_without' => ':valuesが入力されていない場合、:attributeは必須です。',
    'required_without_all' => ':valuesが全て入力されていない場合、:attributeは必須です。',
    'same' => ':attributeと:otherは一致しなければなりません。',
    'size' => [
        'array' => ':attributeの項目数は:size個でなければなりません。',
        'file' => ':attributeのサイズは:size KBでなければなりません。',
        'numeric' => ':attributeは:sizeでなければなりません。',
        'string' => ':attributeは:size文字でなければなりません。',
    ],
    'starts_with' => ':attributeの始まりは以下のいずれかの値でなければなりません: :values',
    'string' => ':attributeは文字列でなければなりません。',
    'timezone' => ':attributeは有効なタイムゾーンでなければなりません。',
    'unique' => ':attributeは既に使用されています。',
    'uploaded' => ':attributeのアップロードに失敗しました。',
    'uppercase' => ':attributeには大文字のみを使用してください。',
    'url' => ':attributeは有効なURLではありません。',
    'ulid' => ':attributeは有効なULIDでなければなりません。',
    'uuid' => ':attributeは有効なUUIDでなければなりません。',

    /*
    |--------------------------------------------------------------------------
    | Custom Validation Language Lines
    |--------------------------------------------------------------------------
    |
    | Here you may specify custom validation messages for attributes using the
    | convention "attribute.rule" to name the lines. This makes it quick to
    | specify a specific custom language line for a given attribute rule.
    |
    */

    'custom' => [
        'attribute-name' => [
            'rule-name' => 'custom-message',
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Custom Validation Attributes
    |--------------------------------------------------------------------------
    |
    | The following language lines are used to swap our attribute placeholder
    | with something more reader friendly such as "E-Mail Address" instead
    | of "email". This simply helps us make our message more expressive.
    |
    */

    'attributes' => [
        'email' => 'メールアドレス',
        'password' => 'パスワード',
        'name' => '名前',
    ],

];
