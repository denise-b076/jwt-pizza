# Curiosity Report: The History of Shell Scripts, Their Languages, and How They Differ From One Another

## Topic Introduction
Ever since I first started programming here at BYU, I have used and executed many shell scripts in many classes. Shell scripts are super helpful for reproducibility and automation in various aspects of programming, which makes it an important tool for DevOps. 

In this class, we briefly learned about creating shell scripts for setup and initialization, using bash as our scripting language for generating the data of JWT Pizza. However, I want to delve deeper into the topic to better understand shell scripting languages as a whole and hopefully become better at creating them for future projects.

## Research Process
In this report, I research the history of shell scripts, identify the most used shell scripting languages today, and attempt to create shell scripts in the three most common languages for Linux systems to compare their formatting conventions, distinctive features, and potential use cases.

## History
To discuss the history of shell scripts, you must understand the history of shells. Before there were shell scripts, in 1971, Ken Thompson at Bell Labs created the first ever interactive shell for invoking commands, called the Thompson shell. While unable to script, the Thompson shell introduced the compact syntax for I/O redirection and piping that are hallmarks of modern shells today. 

Six years later in 1977, Stephen Bourne released the Bourne shell (`sh`), which could not only execute commands, but also invoke and interpret reusable programs, called shell scripts. These shell scripts could utilize loops, control flows, variables, and command substitution. The Bourne Shell is the predecessor and foundation of many shells, including the Bourne Again Shell (`bash`), and the Z Shell (`zsh`). Any such shell based on the Bourne Shell is part of the Bourne Shell family. 

Another shell family is the C Shell Family, whose predecessor, the C Shell (`csh`) was developed by Bill Joy in 1978 to resemble the C language and introduced the very useful command history feature that is common in modern shells. Many other shells exist outside of both families, including Microsoft’s PowerShell (`pwsh`) that passes `.NET` objects between commands instead of unstructured text streams. 

## Current Day Shells
For simplicity’s sake, I will focus on the shells in the Linux system. The most commonly/widely used shells in Linux are Bourne Shell (`sh`), C Shell (`csh`), Korn Shell (`ksh`), GNU Bourne-Again Shell (`bash`), T Shell (`tcsh`), and Z Shell (`zsh`). Of these languages, `ksh`, `bash`, and `zsh` support strong scripting. `bash` is the most used default command-line shell on Linux distributions and Unix-like operating systems, `ksh` is most used on commercial and enterprise Unix operating systems, and `zsh` is most used on macOS, where it has been the default interactive shell since 2019. In my experiments, I will compare these three shell scripting languages. 

## Experimentation
### Intro
I initially decided that I would create two shell scripts per language. One would be common amongst all three languages, and would take in a number, perform various computations and comparisons on that number, and ultimately output the result into a file. The second script for each language would be unique to that language, showcasing a unique and/or defining feature of the language based on my research. 

However, as I researched this topic, I realized that `ksh`, `bash`, and `zsh` share most of the same scripting capabilities. This is not only due to all of them being part of the Bourne Shell family, but also because `bash`, although ultimately based on the Bourne Shell, was influenced by `ksh`, and `zsh` was inspired by both `bash` and `ksh`. Many of their differences lie outside of scripting, such as customization capability and interactive features, which is outside the scope of this curiosity report.

As such, I ended up creating four scripts in total: the first three implement the same job as described previously, while the last displays a distinctive feature of `zsh` shell scripts that is very useful for file matching and searching called extended globbing. The purposes of the scripts will be referred to as job 1 and job 2 respectively.

### Job 1
Before starting, I created three scripts, one for each language. 

```bash
nano number_analysis.sh
nano number_analysis.ksh
nano number_analysis.zsh
```
The file extensions are just naming conventions for ease of locating, and don't alter the behavior/interpretation of each script.

Because `ksh`, `bash`, and `zsh` are all Bourne Shell family languages, they share most of their formatting conventions, which is displayed by the following scripts for this job ultimately being identical outside of the shebang. A shebang allows a shell to interpret a script in a language outside of its own by locating it within the `/bin` directory, so even though I used my macOS terminal’s native `zsh` to initially execute the scripts, they were interpreted and ran via `ksh`, `bash`, and `zsh` respectively. 

```bash
#!/bin/ksh
```
```bash
#!/bin/bash
```
```bash
#!/bin/zsh
```

First, I validated that exactly one argument was provided in the command line when executing the script by checking whether the number of command-line arguments `$#` provided was not equal `-ne` to 1:

```bash
if (( $# != 1 )); then
    echo "Incorrect # of arguments provided"
    exit 1
fi
```

`case` compares the input value against the patterns `-*` and `*` to determine the digits of the input, then compares those digits against the pattern `''|*[!0-9]*` to ensure the input is an integer

```bash
case "$1" in
    -*) digits=${1#-} ;;
    *)  digits=$1 ;;
esac

case "$digits" in
    ''|*[!0-9]*)
        echo "Error: Please provide an integer."
        exit 1
        ;;
esac
```

Then, the code performs various arithmetic comparisons and computations on the input, and stores those in variables:

```bash
if (( $1 > 0 )); then
    sign="Positive"
elif (( number < 0 )); then
    sign="Negative"
else
    sign="Zero"
fi

if (( $1 % 2 == 0 )); then
    parity="Even"
else
    parity="Odd"
fi

square=$(($1 * $1))
cube=$(($1 * $1 * $1))

if (( $1 > 100 )); then
    comparison="Greater than 100"
elif (( $1 < 100 )); then
    comparison="Less than 100"
else
    comparison="Equal to 100"
fi
```

Finally, a new `.txt` file is created in the current directory, and the results of all the previous computations are echoed and redirected into that new file.

```bash
{
echo "Input: $1"
echo "Sign: $sign"
echo "Parity: $parity"
echo "Square: $square"
echo "Cube: $cube"
echo "Comparison: $comparison"
} > bash_analysis.txt #this file name is different for ksh and zsh respectively
```

Altogether, here is the script for `bash`. The `zsh` and `ksh` scripts are identical outside of the shebang and the final output file:

```bash
#!/bin/bash

if (( $# != 1 )); then
    echo "Incorrect # of arguments provided"
    exit 1
fi

case "$1" in
    -*) digits=${1#-} ;;
    *)  digits=$1 ;;
esac

case "$digits" in
    ''|*[!0-9]*)
        echo "Error: Please provide an integer."
        exit 1
        ;;
esac

if (( $1 > 0 )); then
    sign="Positive"
elif (( number < 0 )); then
    sign="Negative"
else
    sign="Zero"
fi

if (( $1 % 2 == 0 )); then
    parity="Even"
else
    parity="Odd"
fi

square=$(($1 * $1))
cube=$(($1 * $1 * $1))

if (( $1 > 100 )); then
    comparison="Greater than 100"
elif (( $1 < 100 )); then
    comparison="Less than 100"
else
    comparison="Equal to 100"
fi

{
echo "Input: $1"
echo "Sign: $sign"
echo "Parity: $parity"
echo "Square: $square"
echo "Cube: $cube"
echo "Comparison: $comparison"
} > bash_analysis.txt

```

To allow the scripts to execute, I had to first give each script permission to do so:

```bash
chmod +x number_analysis.sh
chmod +x number_analysis.ksh
chmod +x number_analysis.zsh
```

Finally, here are some examples of commands to show the outputs of each script are the same.

```bash
./number_analysis.sh 125

./number_analysis.ksh 125

./number_analysis.zsh 125

cat bash_analysis.txt

Input: 125
Sign: Positive
Parity: Odd
Square: 15625
Cube: 1953125
Comparison: Greater than 100

diff bash_analysis.txt ksh_analysis.txt

diff bash_analysis.txt zsh_analysis.txt
```

### Job 2
Although I struggled to find distinctive features of `ksh` and `bash` due to their heritage, `zsh` natively supports extended globbing and glob qualifiers. Globbing is a pattern-matching technique used to find files that match a specified pattern. For example, `**/*.txt` matches any `.txt` file, whether it is in the current directory or a subdirectory.

While both `bash` and `ksh` also support globbing through options, `zsh`’s globbing uniquely supports glob qualifiers. These qualifiers are added in parenthesis at the end of a filename pattern, and tell `zsh` which kinds of files to include, and how they should be sorted and selected. `zsh`’s ability to do so compactly and natively gives it an edge over using `bash` and `ksh` when you want to parse through and sort files.

As such, I decided to create a script that would find all of the `.txt` files in a given directory (or the current one if none was given), and analyze the oldest, newest, largest, and smallest files.

```bash
nano zsh_file_analyzer.zsh
```

First is the shebang that specifies `zsh` as the interpreter.

```bash
#!/bin/zsh
```

Next, the script supports either searching a specific directory or the current directory by setting `target_dir` to the first CLI argument if it exists, or to the current directory if not.

```bash
target_dir="${1:-.}"
```

Then, the script checks whether `target_dir` is an existing directory using the `-d` flag.

```bash
if [[ ! -d "$target_dir" ]]; then
    echo "Error: Directory does not exist."
    exit 1
fi
```

If the directory exists, the current directory is changed to that target directory. If that change in directories fails, the program exits.

```bash
cd -- "$target_dir" || exit 1
```

Next, all regular txt files are found recursively using globbing and glob qualifiers.

```bash
files=(**/*.txt(.N))
```

As discussed earlier, `**/*.txt` matches any txt file, whether it is in the current directory or a subdirectory. The glob qualifiers in the parenthesis are `.`, which ensures only plain files match, and `N`, which enables null-glob behavior if nothing matches, essentially allowing the program to continue running instead of throwing an error.

If there are no matching files, then `files` is empty, and its length `${#files}` is 0, so we exit the program if that is the case.

```bash
echo "Text files found: ${#files}"
echo 

if (( ${#files} == 0 )); then
    echo "No valid files"
    exit 0
fi
```

Each filename is then echoed by iterating through `files`.

```bash
echo "All text files:"

for file in "${files[@]}"; do
    echo "$file"
done
```

Now, we can really showcase the glob qualifiers. First, we can find the most and least recent modified files like so:

```bash
echo
echo "Most recently modified file:"

newest=(**/*.txt(.Nom))
echo "$newest[1]"

echo                                  
echo "Least recently modified file:"

oldest=(**/*.txt(.NOm))   
echo "$oldest[1]"
```

The `m` qualifier specifies that the files should be sorted by last modification time, while the case of `o` specifies whether the resulting matches should be sorted ascending (`o`) or descending (`O`) respectively. For example, `$newest[1]` accesses the first element of the array `newest`, and because `o` and `m` are present as qualifiers, the first element of the array is the most recently modified file.

> **Note:** By default, `zsh` is not a zero-indexed scripting language, so attempting to read the 0th element of an array would return an empty string, and writing to that element would result in an error.

Now we can use a similar command to find the largest and smallest files, using the `L` qualifier instead of the `m` qualifier to sort by file size. 

By using the word-count utility (`wc`) specifying that bytes should be counted (`-c`) and redirecting the largest/smallest file into the command, the size in bytes of the file can be printed alongside its name.

```bash
echo
echo "Largest file:"

largest=(**/*.txt(.NOL))
largest_size=$(wc -c < "$largest[1]")
echo "$largest[1] ($largest_size bytes)"

echo
echo "Smallest file:"

smallest=(**/*.txt(.NoL))   
smallest_size=$(wc -c < "$smallest[1]") 
echo "$smallest[1] ($smallest_size bytes)"
```

Overall, here is the script in its entirety:

```bash
#!/bin/zsh

target_dir="${1:-.}"

if [[ ! -d "$target_dir" ]]; then
    echo "Error: Directory does not exist."
    exit 1
fi

cd -- "$target_dir" || exit 1

files=(**/*.txt(.N))

echo "Text files found: ${#files}"
echo 

if (( ${#files} == 0 )); then
    echo "No valid files"
    exit 0
fi

echo "All text files:"

for file in "${files[@]}"; do
    echo "$file"
done

echo
echo "Most recently modified file:"

newest=(**/*.txt(.Nom))
echo "$newest[1]"

echo                                  
echo "Least recently modified file:"

oldest=(**/*.txt(.NOm))   
echo "$oldest[1]"

echo
echo "Largest file:"

largest=(**/*.txt(.NOL))
largest_size=$(wc -c < "$largest[1]")
echo "$largest[1] ($largest_size bytes)"

echo
echo "Smallest file:"

smallest=(**/*.txt(.NoL))   
smallest_size=$(wc -c < "$smallest[1]") 
echo "$smallest[1] ($smallest_size bytes)"
```

To test this script, I first gave the script execution permissions, then created various files and subdirectories within the subdirectory `testing_zsh`, as well as a single file outside that subdirectory like so:

```bash
chmod +x zsh_file_analyzer.zsh

echo "According to all known laws of aviation, there is no way a bee should be able to fly. Its wings are too small to get its fat little body off the ground. The bee, of course, flies anyway because bees don't care what humans think is impossible." > bee.txt

mkdir testing_zsh && cd testing_zsh

echo 'Hello there friend!' > greeting.txt

echo ':)' > smiles.txt

echo 'There is so much to test and see is there not? What a wonderful world!' > wonder.txt

cd ../
```

Then, I executed the script twice, once to scan the current directory, and then once to scan the `testing_zsh` directory, which had the following results:

```bash
./zsh_file_analyzer

Text files found: 4

All text files:
bee.txt
test_zsh/greeting.txt
test_zsh/smiles.txt
test_zsh/wonder.txt

Most recently modified file:
test_zsh/greeting.txt

Least recently modified file:
bee.txt

Largest file:
bee.txt (     243 bytes)

Smallest file:
test_zsh/smiles.txt (       3 bytes)
```

```bash
./zsh_file_analyzer testing_zsh

Text files found: 3

All text files:
greeting.txt
smiles.txt
wonder.txt

Most recently modified file:
greeting.txt

Least recently modified file:
wonder.txt

Largest file:
wonder.txt (      71 bytes)

Smallest file:
smiles.txt (       3 bytes)
```

## What I Learned/Conclusion
Shell scripting has a much deeper history than I had previously thought, and I find myself much more grateful for the shells I had previously taken for granted. While the shell languages I evaluated were extremely similar due to being derived from the Bourne Shell and each other, that attests to how the formatting of the Bourne Shell has withstood the test of time, allowing documentation to remain mostly consistent across shells of that family. Even if your shell doesn’t support a script’s format, using the shebang to use a different interpreter means you only need to change one line of code as opposed to creating a whole new script. Shell scripting languages can accomplish the same things as each other, but some scripting languages provide easier ways to do so than others, such as `zsh`’s glob qualifiers, giving them an edge for specific jobs. 

Ultimately, shell scripts give you the power to automate many different tasks, and while the scripts in this report are relatively simple, the building blocks for complex environment setup and file accessing/writing are present. For example, I could see the `m` glob qualifier being used in file searching to locate the most recent logs if they haven't been labeled/versioned well. Moving forward, I want to go even more in depth in learning how to create more complex shell scripts, and utilizing more of `zsh`’s glob qualifiers.

## References
- https://en.wikipedia.org/wiki/Shell_script
- https://wp-p.info/tpl_dictionary_rep.php?cat=dictionary-tech-history&fl=shellscript&lang=en
- https://opensource.com/19/9/command-line-heroes-bash
- https://developer.ibm.com/tutorials/l-linux-shells/
- http://opensource.com/business/16/3/top-linux-shells
- https://www.geeksforgeeks.org/linux-unix/different-shells-in-linux/
- https://adamj.eu/tech/2026/10/02/zsh-glob-qualifier-completion/
- https://dmitry-antonyuk.medium.com/zsh-globbing-as-an-alternative-to-find-command-2ebf9da5cffe